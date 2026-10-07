# Data Sourcing Research: Item Definitions and Images

*Researched 2026-10-06. Endpoints marked ✅ were tested live with a single request each, sent
with a descriptive User-Agent.*

## 1. TL;DR and recommendation

**Use the OSRS Wiki as the source, through an offline build step, and serve everything from our
own static hosting.**

- **Item list and metadata:** pull from the wiki's **Bucket API** (`infobox_item`, plus
  `infobox_bonuses` for equipment) and the **Real-time Prices `/mapping`** endpoint. Both return
  bulk data in a handful of requests.
- **Images:** use the wiki's **Detailed Item Images** (`<Item name> detail.png`). These are
  high-resolution renders (the Abyssal whip is 1287×1486), which a blur-and-reveal-tiles game
  needs. Inventory icons are about 30 px, far too small to blur and reveal in sections.
- **Fetch once, cache forever, refresh rarely.** A script runs on a schedule (weekly, or when a
  new game cache appears). It downloads only new or changed images, checked by SHA-1, and writes
  a static `items.json` plus resized images. **Clients never contact the wiki.**
- **Game cache:** this is legally and technically possible (OpenRS2 Archive plus RuneLite's
  `cache` module), and it's the best source for canonical item IDs and definitions. It's a poor
  source for images, though. The cache's built-in renderer produces 36×32 inventory sprites, so
  getting large renders means building a custom 3D model renderer. Keep it as an optional
  phase 2, not the starting point. See §4.
- **Legal posture:** non-commercial, show Jagex's required Fan Content Policy disclaimer, credit
  the wiki under CC BY-NC-SA 3.0, and consider emailing Jagex for clarity (§2.1).

## 2. Legal and licensing landscape

### 2.1 Jagex Fan Content Policy (v1.3, 30 June 2025)

Source: <https://legal.jagex.com/docs/policies/fan-content-policy>

- Fan content must be **non-commercial**: "you can only create content for your personal use and
  not to make money, except as set out in these rules." Ad revenue is explicitly allowed only on
  video platforms like YouTube and Twitch, so **the safe assumption is no ads, no paywall, and no
  merch on this site.**
- **Required disclaimer**, placed "in a prominent and visible place":
  > Created using intellectual property belonging to Jagex Limited under the terms of Jagex's
  > Fan Content Policy. This content is not endorsed by or affiliated with Jagex.
- Don't use Jagex logos or trademarks in a way that implies endorsement. Don't build a site
  "intended to imitate any content produced by Jagex."
- **Grey area:** "You can't make any form of video game content using Jagex Property, which
  includes custom quests or add-ons for integration into one of our games." The examples point
  at in-game content and private servers, and many OSRS fan web games already exist (for example
  osrstools.net's item-scramble and OSRS Wordle). Even so, a browser game built on Jagex art is
  arguably in scope. **Recommendation:** stay strictly non-commercial, and if the project goes
  public, email `IP@Jagex.com` with a short description and ask for a nod. Jagex says it
  "generally won't grant licenses to individuals for relatively small-scale productions," so the
  goal is confirmation that it's fine, not a formal licence.
- The policy prohibits "direct lifts of assets with no creative input." A game that transforms
  the assets (blurring them, building game mechanics around them) is much better placed than a
  raw image gallery.

### 2.2 OSRS Wiki (Weird Gloop) content license

Sources: <https://meta.weirdgloop.org/w/Licensing>, File pages on the wiki

- **Text and data** (names, examine text, infobox values) are licensed **CC BY-NC-SA 3.0**.
  Obligations: **attribution** (a link to the source page or the wiki is enough),
  **NonCommercial**, and **ShareAlike**. Any derived dataset we redistribute, such as our
  `items.json`, must carry the same licence.
- **Images are not under the text licence.** Each File page says, for example: "This is licensed
  media of a copyrighted video game… its copyright is held by Jagex Ltd. It is used with
  permission." So image rights flow from **Jagex**, which brings us back to the Fan Content
  Policy. The wiki is the distribution channel, not the licensor.
- Practical attribution: a site footer naming the OSRS Wiki and CC BY-NC-SA 3.0, plus a link to
  the wiki page on the post-game "answer" screen.

### 2.3 Game cache: Jagex terms

- Jagex's terms say "you must not reverse-engineer, decompile or modify any Jagex Product client
  software." Reading the cache **data files** is a different act from decompiling the
  **client**. The cache is downloaded openly by every client, and it's read by Jagex-approved
  RuneLite, the wiki's own tooling, and the OpenRS2 archive. That's a long-tolerated practice
  across the community.
- Assets pulled from the cache are still **Jagex property**, so the Fan Content Policy applies
  in exactly the same way as for wiki images. The cache adds no extra rights.
- Respectful use means using an **existing public archive** (OpenRS2) instead of scraping
  Jagex's JS5 update servers yourself. Never use cache data for anything that touches live
  gameplay.

**Verdict:** both routes end with the same Jagex permission question. Neither is clearly more
"legal" than the other. The wiki route is simpler and has an explicit "used with permission"
statement, and the wiki is the community-standard source.

## 3. Option A: OSRS Wiki APIs (recommended)

### 3.1 Etiquette rules (apply to all Weird Gloop endpoints)

Sources: <https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices>,
<https://runescape.wiki/w/Help:APIs>

- **A descriptive User-Agent is mandatory**, and it should include contact info. Default UAs
  are blocked outright: `python-requests`, `Python-urllib`, `Apache-HttpClient`, `RestSharp`,
  `Java/x`, `curl/x`. Ours:
  `osrs-item-guesser/<version> (https://<repo-url>; contact: <email or Discord>)`
- There are no explicit rate limits, but heavy use gets blocked. The guidance is to **use bulk
  endpoints instead of looping over IDs**, which "reduces resource consumption by approximately
  100 times."
- Contact point for problems: the OSRS Wiki Discord. Bucket questions go to User:Mudscape.
- There are **no API keys**. Weird Gloop's public APIs are keyless, so "proper key usage" here
  means the UA requirement. No secrets need to be stored.
- Extra good-citizen practice: requests should be **sequential** (no parallel bursts), with a
  small delay between them (≥1 s for images). Add `maxlag=5` to `api.php` calls (the standard
  MediaWiki courtesy that backs off when servers are busy), and retry with exponential backoff
  on 429/5xx.

### 3.2 Real-time Prices `/mapping` ✅

`GET https://prices.runescape.wiki/api/v1/osrs/mapping`

- One request returns about 865 KB of JSON with **4,662 items** (tradeable items only).
- Fields: `id, name, examine, members, value, lowalch, highalch, limit, icon`.
- This is a clean, canonical list of "well-known" items, which makes a good **starting pool**
  for daily answers. Its weakness is coverage: it leaves out untradeables (quest items, many
  rewards).

### 3.3 Bucket API (`infobox_item`, `infobox_bonuses`) ✅

Sources: <https://oldschool.runescape.wiki/w/RuneScape:Bucket>,
<https://meta.weirdgloop.org/w/Extension:Bucket/Api>

`GET https://oldschool.runescape.wiki/api.php?action=bucket&format=json&query=<lua>`

```
bucket('infobox_item')
  .select('page_name','item_name','item_id','image','examine','is_members_only',
          'release_date','value','tradeable','default_version','version_anchor','quest','weight')
  .limit(5000).offset(0)
  .run()
```

- Bucket replaces the deprecated SMW `action=ask` API, so don't build on `ask`.
- `infobox_item` has about **16,900 rows**. **`.limit(5000)` works** (tested), so the full table
  takes about 4 paginated requests.
- `image` is a list of File titles, for example `["File:Abyssal whip.png"]`. The detail image
  usually follows the convention `File:<page name> detail.png`.
- There are many near-duplicates: `Abyssal whip` returns 3 rows (normal, *My Arm's Big
  Adventure*, *Last Man Standing*). We'll need curation rules: prefer `default_version`, drop
  LMS, noted, broken, and other variants, and dedupe by `item_name`.
- `infobox_bonuses` holds `equipment_slot`, `combat_style`, all attack, defence, and strength
  bonuses, and `weapon_attack_speed`. That's useful for grading (§7). `select('*')` is **not**
  supported, so name each field.

### 3.4 Images: `imageinfo` and `/images/` ✅

```
GET https://oldschool.runescape.wiki/api.php?action=query&format=json&maxlag=5
    &prop=imageinfo&iiprop=url|size|sha1|timestamp
    &titles=File:Abyssal whip detail.png|File:...   (up to 50 titles per request)
```

Example result: `File:Abyssal whip detail.png` has size 1287×1486, 73 KB, a `sha1`, and the URL
`https://oldschool.runescape.wiki/images/Abyssal_whip_detail.png`.

- `iiprop=sha1|timestamp` is the key to **incremental refreshes**: re-download only when the
  SHA-1 has changed.
- **Server-side thumbnails exist**:
  `/images/thumb/Abyssal_whip_detail.png/400px-Abyssal_whip_detail.png` returned a 42 KB PNG.
  Requesting the size we actually need saves bandwidth on both ends. Pick one standard width,
  such as 512 px, and stick to it so we hit the wiki's existing thumbnail cache.
- Image responses are CDN-cached (`cache-control: public, s-maxage=86400`). That's no reason to
  hotlink, though. **We self-host copies**, because hotlinking would send every player's page
  load to the wiki, which is exactly what we want to avoid.
- To discover which items have a DII, batch the candidate `File:<name> detail.png` titles
  through `imageinfo` (missing files come back flagged as `missing`). The wiki has no single
  "Detailed images" category we can rely on: that category name came back missing.

### 3.5 Where DIIs come from

According to the wiki's Images and media policy, DIIs and inventory icons are produced from the
cache through Weird Gloop's **Minimal OSRS Item DB** (`chisel.weirdgloop.org/moid`), which is a
research tool, not a bulk API. Don't scrape it. Coverage of DIIs is good for notable items but
**not universal**. Restricting the answer pool to items that have a DII is a feature, because
obscure items without one make bad puzzles anyway.

## 4. Option B: Game cache (possible, but phase 2)

### 4.1 Getting the cache respectfully: OpenRS2 Archive ✅

Source: <https://archive.openrs2.org/>

- A public, automated archive of every OSRS cache. The latest live cache when tested was id
  2727, build 241, dated 2026-09-30, about 190 MB.
- API: `GET /caches.json` lists everything (about 1.4 MB, so fetch it rarely). Then
  `GET /caches/runescape/<id>/disk.zip`, `/flat-file.tar.gz`, and `/keys.json` (XTEA keys,
  needed only for map regions, not items).
- Downloading one cache per game update is very light. An rsync mirror is offered for heavy
  users. Don't poll `caches.json` more than daily.
- Alternative: Abex's `abextm/osrs-cache` GitHub repo tracks each cache as git-friendly
  `.flatcache` files, so you can diff item changes between updates.

### 4.2 Reading it

- **RuneLite `cache` module** (Java, BSD-2): `net.runelite.cache.Cache -c <dir> --items <out>`
  dumps every `ItemDefinition` (id, name, model ids, colours, noted and placeholder links,
  options, and so on) as JSON. `ItemSpriteFactory` renders inventory sprites with no game
  client involved.
- Other readers: `rs-cache` and `osrs-cache` (Rust), `osrscache` (Go).
- Prior art: **RuneProfile** (`github.com/ReinhardtR/runeprofile`) runs a GitHub Action that
  checks OpenRS2 daily. When a new cache appears it re-dumps definitions, renders all item icons
  with RuneLite's cache module, uploads them to its own CDN, and opens a PR. **That's exactly
  the shape of pipeline we'd want** if we go the cache route.
- RuneLite also serves rendered icons at `https://static.runelite.net/cache/item/icon/<id>.png`
  ✅. It's another project's infrastructure, though, so don't hotlink or bulk-scrape it.

### 4.3 Why it's not the first choice

| | Wiki DIIs | Cache |
|---|---|---|
| Image size | ~1000+ px renders, ready to use | 36×32 sprites. Big renders need a custom renderer for models, textures, and lighting |
| Item identity | Curated page per item, with variants labelled | Raw definitions: ~30k+ ids, including noted, placeholder, and unused entries. Heavy filtering needed |
| Metadata (release date, slot, quest) | Yes | Partial (no release dates) |
| Freshness | Edited by humans soon after updates | Instant on game update |
| Effort | Low | High |

**Where the cache is still worth it:** as a cross-check of item IDs and names, as an
independent source if the wiki is unavailable, and potentially for rendering our own
high-resolution, consistently lit images later. That would also remove our dependence on the
wiki for imagery.

## 5. Option C: Third-party aggregated databases

- **osrsreboxed-db** (`0xNeffarion/osrsreboxed-db`, a fork of the abandoned osrsbox-db): a
  combined items JSON plus 20k+ inventory icons, built from the cache and the wiki. Code is
  GPL-3. Wiki-derived data stays CC BY-NC-SA. Freshness depends on volunteers, so check the last
  commit before relying on it. It has only small icons, so it doesn't solve the image problem.
  Useful as a reference or for bootstrapping.

## 6. Recommended pipeline and caching architecture

```
 (weekly cron / GitHub Action, or triggered by new OpenRS2 cache)
 ┌──────────────── build script (runs offline, never in the browser) ───────────────┐
 │ 1. GET /mapping                      (1 request)                                  │
 │ 2. Bucket infobox_item + bonuses     (~4–8 requests, limit 5000, sequential)      │
 │ 3. Curate: dedupe variants, drop LMS/noted/broken, keep items with a DII          │
 │ 4. imageinfo for candidate "X detail.png" (≤50 titles/request) → url + sha1       │
 │ 5. Download only new/changed images at one fixed thumb width (≥1s between, UA)    │
 │ 6. Write data/items.json (+ attribution: source page URL per item)                │
 │ 7. Write the daily puzzle schedule; store images under opaque hashed names        │
 └───────────────────────────────────────────────────────────────────────────────────┘
                         │ committed / uploaded to our static host or CDN
                         ▼
          Players' browsers load ONLY our static files. Zero wiki traffic.
```

Good-citizen checklist:

- [ ] Descriptive User-Agent with contact info on **every** request
- [ ] Bulk endpoints only. Never loop per item where a batch exists
- [ ] Sequential requests, a delay between image downloads, `maxlag=5`, backoff on 429/5xx
- [ ] Incremental: keep `sha1`/`timestamp` from the last run and skip unchanged files
- [ ] Cache raw API responses locally during development so iterating doesn't re-fetch
- [ ] Self-host all images. No hotlinking to the wiki or RuneLite
- [ ] Refresh at most weekly, or on a new game build
- [ ] Footer: Jagex FCP disclaimer, OSRS Wiki credit, CC BY-NC-SA 3.0. Per-item wiki link on
      the answer screen
- [ ] Non-commercial: no ads or paywall

## 7. Data for grading "closeness"

A single % bar needs a similarity function. Available signals:

| Signal | Source |
|---|---|
| Equipment slot, combat style, attack and defence bonuses | `infobox_bonuses` |
| Members / F2P | `infobox_item.is_members_only`, `/mapping.members` |
| Release date (year) | `infobox_item.release_date` (text, needs parsing) |
| Value / high alch | `infobox_item`, `/mapping` |
| Weight | `infobox_item.weight` |
| Associated quest | `infobox_item.quest` |
| Name tokens ("Rune …", "… platebody") | derived from the name |
| Tradeable | `infobox_item.tradeable` |

Options: (a) a weighted score over these, shown as a %. (b) Wordle-style columns (slot ✅/❌,
release year ↑↓, value ↑↓, members ✅/❌), as popular *-dle* games do. (c) A hybrid. Option (b)
is more readable and harder to argue with. Option (a) is fun but needs tuning, because
"Rune platebody" versus "Rune platelegs" should feel close. All of this can be precomputed in
the build step.

## 8. Anti-spoiler notes

- Wiki filenames give the answer away (`Abyssal_whip_detail.png`), so **rename images to opaque
  hashes**.
- If the full image ships to the client, anyone can unblur it in devtools. For a casual game
  that's acceptable. To harden it, pre-slice each puzzle into a blurred base image plus
  individual tile images, and serve them as the player earns them. Static files still work, as
  long as tile URLs are unguessable (for example, hashed with a per-day salt).
- Don't put the answer list in plain text in the client bundle. Ship only the day's puzzle id,
  and check guesses against a hash, or reveal the answer at the end.

## 9. Next steps

1. Write the build script (Node or Python) with the UA and caching rules above, and cache raw
   responses in `.cache/`.
2. Measure how many curated items actually have a DII, to size the answer pool.
3. Prototype the blur and tile-reveal UI against a few local images.
4. Decide on the grading scheme (§7).
5. Before going public, email `IP@Jagex.com` with a short description.

## Sources

- Jagex Fan Content Policy: <https://legal.jagex.com/docs/policies/fan-content-policy>
- Weird Gloop licensing: <https://meta.weirdgloop.org/w/Licensing>
- OSRS Wiki Real-time Prices API: <https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices>
- Weird Gloop API help (RS3 wiki, same policies): <https://runescape.wiki/w/Help:APIs>
- OSRS Wiki Bucket: <https://oldschool.runescape.wiki/w/RuneScape:Bucket>
- Bucket API: <https://meta.weirdgloop.org/w/Extension:Bucket/Api>
- Bucket:Infobox_item: <https://oldschool.runescape.wiki/w/Bucket:Infobox_item>
- Bucket:Infobox_bonuses: <https://oldschool.runescape.wiki/w/Bucket:Infobox_bonuses>
- Images and media policy: <https://oldschool.runescape.wiki/w/RuneScape:Images_and_media_policy>
- Example DII: <https://oldschool.runescape.wiki/w/File:Abyssal_whip_detail.png>
- Minimal OSRS Item DB: <https://chisel.weirdgloop.org/moid/>
- OpenRS2 Archive: <https://archive.openrs2.org/> (API: <https://archive.openrs2.org/api>)
- RuneLite cache module: <https://github.com/runelite/runelite/tree/master/cache>
- abextm/osrs-cache: <https://github.com/abextm/osrs-cache>
- RuneProfile (cache → icons pipeline prior art): <https://github.com/ReinhardtR/runeprofile>
- osrsreboxed-db: <https://github.com/0xNeffarion/osrsreboxed-db>
- Third-party client guidelines: <https://oldschool.runescape.wiki/w/Update:Third_Party_Client_Guidelines>
- Existing OSRS fan web games: <https://www.osrstools.net/games>
