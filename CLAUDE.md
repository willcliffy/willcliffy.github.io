# OSRS Item Guesser: notes for agents

Daily NYT-style game: guess an Old School RuneScape item from a blurred image, revealing one
tile per guess. See README.md.

## Rules for working here

- **Never query the OSRS Wiki or its APIs (or any other external data source) without the
  user's explicit sign-off for that specific run.** Write the script, let the user review it,
  and run it only when asked. Dry runs don't make requests, but still ask before running one.
- All wiki requests: a descriptive User-Agent with contact info, sequential with a delay,
  `maxlag=5`, backoff on errors. Details are in `docs/data-sourcing-research.md` §3.1.
- Item text data is already downloaded in full in `data/wiki/` and should not be re-fetched.
  Work from the local files.
- The wiki CDN (Cloudflare Polish) sometimes recompresses images in transit (2 of 8 files so
  far). Those don't match the wiki's recorded SHA-1, so `verify_download` in
  `scripts/fetch_item_image.py` accepts an exact SHA-1 match, or a `cf-polished: orig_size`
  equal to the wiki's size plus matching dimensions. Download originals, not
  thumbnails: originals are CDN cache hits, while uncommon thumbnail sizes make the wiki render new files.

## Where things are

| Path | What |
|---|---|
| `docs/data-sourcing-research.md` | Data sources, licensing, API etiquette, pipeline plan |
| `docs/item-pool-filtering.md` | Item pool analysis, variant groups, filtering plan. **Read before touching the answer pool** |
| `config/item-pool.toml` | Filter levers (variant modes etc.). Read by `scripts/build_pool.py`, which isn't written yet |
| `scripts/fetch_bucket_data.py` | One-time wiki Bucket dump into `data/wiki/` (done; don't re-run) |
| `scripts/fetch_item_image.py` | Fetch one item's detail image and metadata into `data/images/` |
| `scripts/build_prototype_data.py` | Local only: `data/wiki/` → `prototype/items.js` |
| `prototype/index.html` | Playable prototype; open from disk |

## Data gotchas

- Bucket booleans: `true` is `""`, `false` means the field is absent.
- Many rows share an `item_name` (LMS copies, per-step clue pages, versions). Pick
  `page_name == item_name` first, then `default_version`, then the earliest release.
