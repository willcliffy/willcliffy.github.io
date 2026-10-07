#!/usr/bin/env python3
"""
One-time bulk download of OSRS Wiki item data via the Bucket API.

Pulls every row of every bucket listed in BUCKETS, ROWS_PER_CHUNK rows per request,
and writes them to disk so the project never needs to poll the wiki for text data again.

Good-citizen behaviour (see docs/data-sourcing-research.md §3.1):
  - Descriptive User-Agent with contact info (required --contact argument).
  - Strictly sequential requests with a delay between them (--delay, default 3s).
  - maxlag=5 on every api.php call; backs off on maxlag / HTTP 429 / 5xx, honouring Retry-After.
  - Resumable: each chunk is saved as soon as it arrives, and chunks already on disk are
    never re-requested. A crash or Ctrl-C mid-run costs nothing to resume.
  - Refuses to re-download a bucket that already completed unless --force is given.

Output layout (under --out, default data/wiki):
  raw/<bucket>/chunk_<offset>.json   exact API response for each chunk
  <bucket>.json                      all rows of that bucket, combined
  manifest.json                      fetch time, queries, row counts, licence/attribution

Usage:
  python3 scripts/fetch_bucket_data.py --contact "you@example.com" --dry-run
  python3 scripts/fetch_bucket_data.py --contact "you@example.com"

Data licence: OSRS Wiki content is CC BY-NC-SA 3.0. Keep manifest.json alongside the data.
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_URL = "https://oldschool.runescape.wiki/api.php"
ROWS_PER_CHUNK = 2500
TOOL_NAME = "osrs-item-guesser-bucket-fetch/1.0"

# Every field of each bucket, taken from the bucket schema pages on 2026-10-06:
#   https://oldschool.runescape.wiki/w/Bucket:Infobox_item
#   https://oldschool.runescape.wiki/w/Bucket:Infobox_bonuses
# Bucket does not support select('*'), so fields must be listed explicitly.
# page_name / page_name_sub are built-in fields present on every bucket row.
BUCKETS = {
    "infobox_item": [
        "page_name",
        "page_name_sub",
        "item_name",
        "image",
        "is_members_only",
        "item_id",
        "examine",
        "high_alchemy_value",
        "league_region",
        "release_date",
        "removal_date",
        "value",
        "weight",
        "version_anchor",
        "buy_limit",
        "default_version",
        "quest",
        "tradeable",
    ],
    "infobox_bonuses": [
        "page_name",
        "page_name_sub",
        "stab_attack_bonus",
        "slash_attack_bonus",
        "crush_attack_bonus",
        "range_attack_bonus",
        "magic_attack_bonus",
        "stab_defence_bonus",
        "slash_defence_bonus",
        "crush_defence_bonus",
        "range_defence_bonus",
        "magic_defence_bonus",
        "strength_bonus",
        "ranged_strength_bonus",
        "prayer_bonus",
        "magic_damage_bonus",
        "equipment_slot",
        "weapon_attack_speed",
        "weapon_attack_range",
        "combat_style",
    ],
}

# Safety valve: if a bucket somehow never returns a short page, stop rather than loop forever.
# infobox_item had ~16,900 rows on 2026-10-06, so 20 chunks (50,000 rows) is ample headroom.
MAX_CHUNKS_PER_BUCKET = 20

MAX_RETRIES = 6
TIMEOUT_SECONDS = 60


def lua_str(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def build_query(bucket, fields, offset):
    # Bucket has no orderBy() (the API rejects it), so pagination relies on the default
    # order; fetch_bucket checks the result for duplicate rows instead.
    select = ",".join(lua_str(f) for f in fields)
    return f"bucket({lua_str(bucket)}).select({select}).limit({ROWS_PER_CHUNK}).offset({offset}).run()"


def build_url(query):
    params = {"action": "bucket", "format": "json", "maxlag": "5", "query": query}
    return API_URL + "?" + urllib.parse.urlencode(params)


def fetch_json(url, user_agent):
    """GET url, retrying with exponential backoff on maxlag, 429 and 5xx."""
    backoff = 10
    for attempt in range(1, MAX_RETRIES + 1):
        req = urllib.request.Request(
            url, headers={"User-Agent": user_agent, "Accept": "application/json"}
        )
        wait = None
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            err = body.get("error")
            # MediaWiki-level errors are objects ({"code": ..., "info": ...}).
            if isinstance(err, dict) and err.get("code") == "maxlag":
                wait = backoff
                print(f"    server lagged (maxlag); waiting {wait}s", file=sys.stderr)
            else:
                return body
        except urllib.error.HTTPError as e:
            if e.code == 429 or 500 <= e.code < 600:
                retry_after = e.headers.get("Retry-After")
                wait = int(retry_after) if retry_after and retry_after.isdigit() else backoff
                print(f"    HTTP {e.code}; waiting {wait}s", file=sys.stderr)
            else:
                raise
        except (urllib.error.URLError, TimeoutError) as e:
            wait = backoff
            print(f"    network error ({e}); waiting {wait}s", file=sys.stderr)

        if attempt == MAX_RETRIES:
            break
        time.sleep(wait)
        backoff = min(backoff * 2, 300)
    raise RuntimeError(f"giving up after {MAX_RETRIES} attempts: {url}")


def fetch_bucket(bucket, fields, out_dir, user_agent, delay, dry_run, state):
    raw_dir = out_dir / "raw" / bucket
    if not dry_run:
        raw_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    queries = []
    for chunk in range(MAX_CHUNKS_PER_BUCKET):
        offset = chunk * ROWS_PER_CHUNK
        query = build_query(bucket, fields, offset)
        url = build_url(query)
        queries.append(query)
        chunk_path = raw_dir / f"chunk_{offset:06d}.json"

        if dry_run:
            print(f"  [dry-run] chunk {chunk} (offset {offset})")
            print(f"    query: {query}")
            print(f"    url:   {url}")
            if chunk == 0:
                print(f"  [dry-run] ...further chunks continue at +{ROWS_PER_CHUNK} until a "
                      f"chunk returns fewer than {ROWS_PER_CHUNK} rows "
                      f"(max {MAX_CHUNKS_PER_BUCKET} chunks)")
            return None, queries

        if chunk_path.exists():
            body = json.loads(chunk_path.read_text(encoding="utf-8"))
            print(f"  chunk {chunk} (offset {offset}): already on disk, not re-requesting")
        else:
            if state["requests"] > 0:
                time.sleep(delay)
            print(f"  chunk {chunk} (offset {offset}): requesting...")
            body = fetch_json(url, user_agent)
            state["requests"] += 1
            if body.get("error"):
                raise RuntimeError(f"Bucket API error for {bucket}: {body['error']}")
            # Write atomically so an interrupted write never leaves a corrupt "complete" chunk.
            tmp = chunk_path.with_suffix(".tmp")
            tmp.write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")
            tmp.replace(chunk_path)

        batch = body.get("bucket", [])
        rows.extend(batch)
        print(f"    {len(batch)} rows (running total {len(rows)})")
        if len(batch) < ROWS_PER_CHUNK:
            break
    else:
        raise RuntimeError(
            f"{bucket}: hit MAX_CHUNKS_PER_BUCKET ({MAX_CHUNKS_PER_BUCKET}) without a short "
            "chunk; raise the limit if the bucket has really grown that large"
        )

    # Report (but keep) exact duplicate rows; they'd indicate unstable pagination.
    seen = set()
    dupes = 0
    for r in rows:
        key = json.dumps(r, sort_keys=True)
        if key in seen:
            dupes += 1
        seen.add(key)
    if dupes:
        print(f"  WARNING: {dupes} exact duplicate rows in {bucket}; pagination may be unstable",
              file=sys.stderr)

    (out_dir / f"{bucket}.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return rows, queries


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--contact", required=True,
                   help="email or Discord handle included in the User-Agent (required by the wiki)")
    p.add_argument("--out", default="data/wiki", help="output directory (default: data/wiki)")
    p.add_argument("--delay", type=float, default=3.0,
                   help="seconds to wait between requests (default: 3, minimum: 1)")
    p.add_argument("--bucket", action="append", choices=sorted(BUCKETS),
                   help="only fetch this bucket (repeatable; default: all)")
    p.add_argument("--force", action="store_true",
                   help="re-download buckets that already have a combined output file")
    p.add_argument("--dry-run", action="store_true",
                   help="print the User-Agent, queries and URLs that would be used; no network access, no files written")
    args = p.parse_args()

    if args.delay < 1:
        p.error("--delay must be at least 1 second")

    user_agent = f"{TOOL_NAME} (OSRS item guessing fan game; one-time bulk fetch; contact: {args.contact})"
    out_dir = Path(args.out)
    buckets = args.bucket or list(BUCKETS)

    print(f"User-Agent: {user_agent}")
    print(f"Output:     {out_dir.resolve()}")
    print(f"Chunk size: {ROWS_PER_CHUNK} rows, delay {args.delay}s between requests")
    if args.dry_run:
        print("DRY RUN: no requests will be sent and nothing will be written.\n")

    manifest_path = out_dir / "manifest.json"
    manifest = {}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest.setdefault("buckets", {})

    state = {"requests": 0}
    for bucket in buckets:
        combined = out_dir / f"{bucket}.json"
        if combined.exists() and not args.force:
            print(f"[{bucket}] {combined} already exists; skipping (use --force to re-fetch)")
            continue
        if combined.exists() and args.force and not args.dry_run:
            # --force means a fresh pull, so stale raw chunks must not be reused.
            for old in (out_dir / "raw" / bucket).glob("chunk_*.json"):
                old.unlink()

        print(f"[{bucket}] {len(BUCKETS[bucket])} fields")
        rows, queries = fetch_bucket(bucket, BUCKETS[bucket], out_dir, user_agent,
                                     args.delay, args.dry_run, state)
        if args.dry_run:
            continue
        print(f"[{bucket}] done: {len(rows)} rows -> {combined}")
        manifest["buckets"][bucket] = {
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "rows": len(rows),
            "fields": BUCKETS[bucket],
            "chunk_size": ROWS_PER_CHUNK,
            "queries": queries,
        }

    if args.dry_run:
        print("\nDry run complete.")
        return

    manifest.update({
        "source": "Old School RuneScape Wiki, Bucket API (https://oldschool.runescape.wiki/api.php?action=bucket)",
        "license": "CC BY-NC-SA 3.0 (https://creativecommons.org/licenses/by-nc-sa/3.0/)",
        "attribution": "Data from the Old School RuneScape Wiki (https://oldschool.runescape.wiki). "
                       "RuneScape and Old School RuneScape are trademarks of Jagex Ltd.",
        # The contact is redacted so saved metadata never carries personal details.
        "user_agent": user_agent.replace(args.contact, "<redacted>"),
    })
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{state['requests']} request(s) sent. Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
