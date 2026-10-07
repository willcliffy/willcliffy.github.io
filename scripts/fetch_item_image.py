#!/usr/bin/env python3
"""
Download the image for one item from the OSRS Wiki, plus all metadata about it.

The item is looked up in the local Bucket dump (data/wiki/infobox_item.json, produced by
fetch_bucket_data.py), so no wiki request is needed to find its image. Then:

  1. ONE api.php imageinfo request covering both the Detailed Item Image
     ("<icon name> detail.png") and the inventory icon named in the item's `image` field.
     The raw response is saved verbatim.
  2. ONE download of the chosen file: the detail image, or the inventory icon if there is
     no detail image and --fallback-icon is given. The original file is downloaded and checked
     against the wiki's SHA-1, or, when the CDN has recompressed it, against the original size
     Cloudflare reports plus the pixel dimensions (see verify_download). Originals are usually already in the wiki's CDN cache, whereas
     an uncommon thumbnail size makes the wiki render a new file just for us. Resize locally.
     --thumb-width opts back into wiki thumbnails (these can't be SHA-1 checked).

Same good-citizen rules as fetch_bucket_data.py: descriptive User-Agent with contact info,
maxlag=5 on api.php, sequential requests with a delay, backoff on 429/5xx, and no
re-download if the image is already on disk (unless --force).

Output (under --out, default data/images), named after the wiki file:
  <File_name>.png                 the image
  <File_name>.imageinfo.json      raw imageinfo API response, exactly as received
  <File_name>.meta.json           everything else: item row, chosen file, URLs, sizes,
                                  hashes, download response headers, attribution

Usage:
  python3 scripts/fetch_item_image.py --contact "you@example.com" \\
      --page "Clue scroll (master) - 19.43N 23.11W" --dry-run
"""

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from fetch_bucket_data import API_URL, MAX_RETRIES, TIMEOUT_SECONDS, fetch_json

TOOL_NAME = "osrs-item-guesser-image-fetch/1.0"
ITEMS_PATH = Path("data/wiki/infobox_item.json")

# Everything imageinfo can tell us that's relevant to a static PNG.
# extmetadata carries the licence/attribution fields from the File page.
IIPROP = "timestamp|user|comment|url|size|sha1|mime|mediatype|bitdepth|extmetadata"


def find_item(page):
    rows = json.loads(ITEMS_PATH.read_text(encoding="utf-8"))
    matches = [r for r in rows if r.get("page_name_sub") == page]
    if not matches:
        matches = [r for r in rows if r.get("page_name") == page]
    if not matches:
        sys.exit(f"No row in {ITEMS_PATH} with page_name or page_name_sub == {page!r}")
    images = {tuple(r.get("image") or []) for r in matches}
    if len(images) > 1:
        subs = "\n  ".join(sorted(r.get("page_name_sub", "") for r in matches))
        sys.exit(f"{page!r} matches rows with different images; pass a page_name_sub:\n  {subs}")
    row = matches[0]
    if not row.get("image"):
        sys.exit(f"{page!r} has no image field in the item data")
    return row


def detail_title(icon_title):
    # Wiki convention: "File:<Item name>.png" -> "File:<Item name> detail.png"
    if not icon_title.lower().endswith(".png"):
        sys.exit(f"Unexpected icon file type: {icon_title!r}")
    return icon_title[:-4] + " detail.png"


def build_imageinfo_url(titles, thumb_width=None):
    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "maxlag": "5",
        "prop": "imageinfo",
        "iiprop": IIPROP,
        "titles": "|".join(titles),
    }
    if thumb_width:
        params["iiurlwidth"] = str(thumb_width)
    return API_URL + "?" + urllib.parse.urlencode(params)


def local_basename(file_title):
    name = file_title.split(":", 1)[1].rsplit(".", 1)[0].replace(" ", "_")
    return re.sub(r"[^\w().,'+-]", "_", name)


def fetch_bytes(url, user_agent):
    """GET a file, retrying with exponential backoff on 429 / 5xx / network errors."""
    backoff = 10
    for attempt in range(1, MAX_RETRIES + 1):
        req = urllib.request.Request(url, headers={"User-Agent": user_agent})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
                return resp.read(), dict(resp.headers.items())
        except urllib.error.HTTPError as e:
            if not (e.code == 429 or 500 <= e.code < 600):
                raise
            retry_after = e.headers.get("Retry-After")
            wait = int(retry_after) if retry_after and retry_after.isdigit() else backoff
            print(f"    HTTP {e.code}; waiting {wait}s", file=sys.stderr)
        except (urllib.error.URLError, TimeoutError) as e:
            wait = backoff
            print(f"    network error ({e}); waiting {wait}s", file=sys.stderr)
        if attempt == MAX_RETRIES:
            break
        time.sleep(wait)
        backoff = min(backoff * 2, 300)
    raise RuntimeError(f"giving up after {MAX_RETRIES} attempts: {url}")


def verify_download(ii, use_thumb, sha1_ok, png_width, png_height, headers):
    """Return {check_name: passed} for a downloaded file.

    The wiki's CDN (Cloudflare Polish) losslessly recompresses images in transit, so served
    originals almost never match the SHA-1 the wiki recorded at upload. When that happens,
    accept the file if Cloudflare reports the original's size ("cf-polished: ok, orig_size=N")
    and it matches the wiki's size, and the pixel dimensions match too.
    """
    if use_thumb:
        return {"dimensions": (png_width, png_height) == (ii.get("thumbwidth"), ii.get("thumbheight"))}
    checks = {"dimensions": (png_width, png_height) == (ii.get("width"), ii.get("height"))}
    if sha1_ok:
        checks["sha1"] = True
    else:
        polished = next((v for k, v in headers.items() if k.lower() == "cf-polished"), "")
        m = re.search(r"orig_size=(\d+)", polished)
        checks["cdn_orig_size"] = bool(m) and int(m.group(1)) == ii.get("size")
    return checks


def write_atomic(path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(path)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--contact", required=True,
                   help="email or Discord handle included in the User-Agent (required by the wiki)")
    p.add_argument("--page", required=True,
                   help="the item's page_name or page_name_sub, as in data/wiki/infobox_item.json")
    p.add_argument("--thumb-width", type=int,
                   help="download a wiki-rendered thumbnail at this width instead of the original "
                        "(not recommended: may make the wiki render a new thumbnail)")
    p.add_argument("--out", default="data/images", help="output directory (default: data/images)")
    p.add_argument("--delay", type=float, default=3.0,
                   help="seconds to wait between the two requests (default: 3, minimum: 1)")
    p.add_argument("--fallback-icon", action="store_true",
                   help="download the small inventory icon if no detail image exists")
    p.add_argument("--force", action="store_true", help="re-download even if the image is already on disk")
    p.add_argument("--dry-run", action="store_true",
                   help="print what would be requested; no network access, no files written")
    args = p.parse_args()

    if args.delay < 1:
        p.error("--delay must be at least 1 second")
    if args.thumb_width is not None and args.thumb_width < 1:
        p.error("--thumb-width must be positive")

    user_agent = f"{TOOL_NAME} (OSRS item guessing fan game; contact: {args.contact})"
    out_dir = Path(args.out)

    row = find_item(args.page)
    icon = row["image"][0]
    detail = detail_title(icon)
    titles = [detail, icon]
    info_url = build_imageinfo_url(titles, args.thumb_width)

    print(f"User-Agent: {user_agent}")
    print(f"Item:       {row.get('page_name_sub') or row.get('page_name')}")
    print(f"Wanted:     {detail}")
    print(f"Fallback:   {icon} ({'enabled' if args.fallback_icon else 'disabled'})")

    if not args.force:
        for t in titles:
            existing = out_dir / f"{local_basename(t)}.png"
            if existing.exists():
                print(f"{existing} already exists; nothing to do (use --force to re-download)")
                return

    if args.dry_run:
        print("\nDRY RUN: no requests will be sent and nothing will be written.")
        print(f"\nRequest 1 (imageinfo): {info_url}")
        print(f"  raw response would be saved to {out_dir}/<File_name>.imageinfo.json")
        print(f"\nRequest 2 (download), after a {args.delay}s pause:")
        if args.thumb_width:
            print(f"  thumburl at {args.thumb_width}px if the original is wider, otherwise the original url,")
        else:
            print("  the original file url (SHA-1 checked),")
        print(f"  for {detail}" + (f" (or {icon} if missing)" if args.fallback_icon else ""))
        print(f"  saved to {out_dir}/<File_name>.png with metadata in <File_name>.meta.json")
        print("\nDry run complete.")
        return

    out_dir.mkdir(parents=True, exist_ok=True)

    # --- Request 1: imageinfo ---
    print("\nRequest 1: imageinfo...")
    fetched_info_at = datetime.now(timezone.utc).isoformat()
    info = fetch_json(info_url, user_agent)
    # Save the raw response before anything else, so it's kept even if the next step fails.
    info_text = json.dumps(info, ensure_ascii=False, indent=2)
    if info.get("error"):
        (out_dir / f"{local_basename(detail)}.imageinfo.json").write_text(info_text, encoding="utf-8")
        sys.exit(f"API error: {info['error']}")

    # formatversion=2 returns titles normalised (underscores -> spaces), matching ours.
    pages = {pg["title"]: pg for pg in info.get("query", {}).get("pages", [])}
    chosen = None
    for t in titles:
        pg = pages.get(t)
        if pg and not pg.get("missing") and pg.get("imageinfo"):
            if t == icon and not args.fallback_icon:
                break
            chosen = (t, pg)
            break
        print(f"  {t}: not found on the wiki")

    base = local_basename(chosen[0] if chosen else detail)
    info_path = out_dir / f"{base}.imageinfo.json"
    info_path.write_text(info_text, encoding="utf-8")
    print(f"  raw response saved to {info_path}")

    if not chosen:
        hint = "" if args.fallback_icon else " (rerun with --fallback-icon to take the inventory icon)"
        sys.exit(f"No usable image for this item{hint}. No download made.")

    title, page = chosen
    ii = page["imageinfo"][0]
    use_thumb = bool(args.thumb_width and ii.get("thumburl")) and ii.get("width", 0) > args.thumb_width
    dl_url = ii["thumburl"] if use_thumb else ii["url"]
    print(f"  using {title}: original {ii.get('width')}x{ii.get('height')}, "
          f"downloading {'thumbnail' if use_thumb else 'original'}")

    # --- Request 2: download ---
    time.sleep(args.delay)
    print(f"Request 2: {dl_url}")
    data, headers = fetch_bytes(dl_url, user_agent)
    fetched_file_at = datetime.now(timezone.utc).isoformat()

    if not data:
        sys.exit("Downloaded file is empty; nothing saved.")
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        sys.exit(f"Downloaded file is not a PNG (Content-Type: {headers.get('Content-Type')}); nothing saved.")
    local_sha1 = hashlib.sha1(data).hexdigest()
    # PNG IHDR: width and height are big-endian uint32s at bytes 16-24.
    png_width = int.from_bytes(data[16:20], "big")
    png_height = int.from_bytes(data[20:24], "big")
    sha1_ok = None if use_thumb else local_sha1 == ii.get("sha1")
    checks = verify_download(ii, use_thumb, sha1_ok, png_width, png_height, headers)
    verified = all(checks.values())

    # If verification fails, keep the bytes and metadata under an ".unverified" name so the
    # result can be investigated without downloading it again.
    img_path = out_dir / (f"{base}.png" if verified else f"{base}.unverified.png")
    write_atomic(img_path, data)

    meta = {
        "item": row,
        "file_title": title,
        "is_detail_image": title == detail,
        "description_url": ii.get("descriptionurl"),
        "original": {
            "url": ii.get("url"),
            "width": ii.get("width"),
            "height": ii.get("height"),
            "size_bytes": ii.get("size"),
            "sha1": ii.get("sha1"),
            "mime": ii.get("mime"),
            "uploaded_at": ii.get("timestamp"),
            "uploaded_by": ii.get("user"),
            "upload_comment": ii.get("comment"),
        },
        "downloaded": {
            "path": str(img_path),
            "url": dl_url,
            "is_thumbnail": use_thumb,
            "width": ii.get("thumbwidth") if use_thumb else ii.get("width"),
            "height": ii.get("thumbheight") if use_thumb else ii.get("height"),
            "size_bytes": len(data),
            "png_width": png_width,
            "png_height": png_height,
            "sha1": local_sha1,
            "sha1_matches_wiki": sha1_ok,
            "verification": checks,
            "verified": verified,
            "sha256": hashlib.sha256(data).hexdigest(),
            "response_headers": headers,
        },
        "extmetadata": ii.get("extmetadata"),
        "imageinfo_query_url": info_url,
        "imageinfo_response_path": str(info_path),
        "imageinfo_fetched_at": fetched_info_at,
        "file_fetched_at": fetched_file_at,
        # The contact is redacted so saved metadata never carries personal details.
        "user_agent": user_agent.replace(args.contact, "<redacted>"),
        "license": "Image copyright Jagex Ltd., used on the OSRS Wiki with permission; "
                   "reused under Jagex's Fan Content Policy",
        "attribution": f"Image from the Old School RuneScape Wiki ({ii.get('descriptionurl')}). "
                       "© Jagex Ltd.",
    }
    meta_path = out_dir / f"{base}.meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\nVerification: " + ", ".join(f"{k}={'ok' if v else 'FAILED'}" for k, v in checks.items()))
    if not verified:
        print(f"Downloaded {len(data)} bytes, {png_width}x{png_height}, SHA-1 {local_sha1}; "
              f"wiki says {ii.get('size')} bytes, {ii.get('width')}x{ii.get('height')}, SHA-1 {ii.get('sha1')}.")
        print(f"Saved as {img_path} for inspection, with metadata in {meta_path}.")
        sys.exit(1)

    print(f"\nSaved {img_path} ({len(data)} bytes)")
    print(f"      {meta_path}")
    print(f"      {info_path}")
    print("2 request(s) sent.")


if __name__ == "__main__":
    main()
