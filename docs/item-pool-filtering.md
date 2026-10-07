# Item Pool Filtering

*Analysis of the local wiki dump (`data/wiki/infobox_item.json`, fetched 2026-10-06). All
counts here came from that local data, with no wiki requests.*

This is the plan for narrowing about 12,300 item names down to items that make good daily
answers. The adjustable levers live in [`config/item-pool.toml`](../config/item-pool.toml). This
doc explains them. **Status:** analysis and config are done. `scripts/build_pool.py`, which will
read the config, is not written yet.

## Data facts worth knowing first

- `infobox_item` has 16,888 rows but only **12,307 distinct `item_name`s**. Rows repeat because
  of variants, per-version pages and special copies.
- **True/false fields:** Bucket stores `true` as an empty string `""` and leaves `false` fields
  out entirely. So `"tradeable" in row` means tradeable. This is consistent across the fields
  we've used.
- **Duplicates of the same name.** Several rows can share an `item_name`:
  - Last Man Standing copies, e.g. `Abyssal whip (Last Man Standing)`, are a different page
    with the same `item_name`.
  - Per-step clue pages, e.g. `Clue scroll (master) - 19.43N 23.11W`.
  
  To pick one row per name, prefer the row whose `page_name == item_name`, then
  `default_version`, then the earliest `release_date`. That's what
  `scripts/build_prototype_data.py` does. A naive "first or last row" picks the wrong one, such
  as the LMS whip, which is F2P and from 2016.
- `quest` is `"No"` or a wiki link like `[[Dragon Slayer II]]`.
- `release_date` is free text such as `"6 July 2016"`. A year is found in all but 594 rows.
- Variant suffixes can stack: `Abyssal dagger (bh)(p++)`, `Ancient sceptre (l) (broken)`. 67
  names carry more than one variant suffix, so strip suffixes repeatedly, not once.
- Some special-copy markers appear only in `page_name`, not `item_name`: `(interface item)`
  (598 rows), `(unobtainable item)` (241), `(Last Man Standing)` (185), `(beta)` (155),
  `(historical)` (48), `(animation item)` (34), `(PvP Championship)` (32),
  `(discontinued)` (21).

## Layer 1: structural filters

These are automatic, use local data only, and are always safe. Here's the funnel from the
first prototype pass:

| Stage | Distinct names left |
|---|---|
| Start | 12,307 |
| Drop rows with no `item_id` | 12,304 |
| Drop removed items (`removal_date` set) | 11,646 |
| Drop special-copy pages (list above) | 11,128 |
| Drop per-step pages (`" - "` in `page_name`) | 11,107 |
| Merge all variant suffixes into the base item (crude regex) | 9,486 |
| One answer per image file | 9,164 |
| …of which tradeable or equipment | 5,867 |

The "merge all variants" row used one blanket regex. It's being replaced by the per-group levers
below, so the real number will depend on the config.

**Still to do in Layer 1: require a detail image.** We need the one-time imageinfo lookup
(`prop=imageinfo`, 50 titles per request). For about 9,200 candidates, that's around 185
requests in sequence, and it **needs the user's sign-off before running**. The detail image
name is the icon name with `" detail.png"` appended. See
`docs/data-sourcing-research.md` and `scripts/fetch_item_image.py`.

## Variant groups (the levers)

Each group is a set of trailing `(…)` tags on `item_name`. A tag must match the **whole**
bracket text, case-insensitively. Each group has a `mode`:

- **keep**: the variant is its own answer candidate.
- **exclude**: never an answer. It's still guessable and is graded as a different item.
- **collapse**: never an answer. Guessing it when the answer is its base item counts as correct.
  **If the base doesn't exist** (e.g. `Avantoe potion (unf)` has no `Avantoe potion`), the
  variant is treated as **keep**, otherwise it would vanish from the pool.

| Group | Tags | Names | Default | Examples / notes |
|---|---|---|---|---|
| doses_charges | `(1)`, `(2)`, … | 882 | collapse | Prayer potion(4), Amulet of glory(6), Apples(5), Black mask (10). Covers doses, charges and basket counts |
| poison | `p`, `p+`, `p++`, `kp` | 240 | collapse | Dragon dagger(p++); `kp` = karambwan poison (Adamant spear(kp)) |
| imbued | `i` | 78 | collapse | Berserker ring (i). Usually looks the same as the base |
| ornament_kit | `or` | 72 | exclude | Abyssal whip (or). Visibly recoloured, so collapsing would be unfair |
| trimmed | `g`, `t` | 159 | exclude | Adamant platebody (g)/(t). Treasure-trail trims |
| heraldic | `h1`–`h5` | 45 | exclude | Adamant helm (h1) |
| tiered_cosmetic | `t1`–`t3` | 87 | exclude | Adventurer's boots (t1), Amulet of glory (t1) |
| broken_locked | `broken`, `l`, `mangled`, `damaged` | 226 | collapse | Adamant defender (broken)/(l), Elite void robe (l) (mangled) |
| charge_state | `inactive`, `uncharged`, `empty`, `full`, `u`, `unf`, `lit` | 196 | collapse | Arclight (inactive), Celestial ring (uncharged), Bronze crossbow (u), Bronze bolts (unf). Many `unf` potions have no base, so they stay as keep |
| game_mode | `bh`, `Deadman`, `beta`, `nz`, `cookout` | 112 | exclude | Abyssal dagger (bh), Dark bow (Deadman), Air rune (nz), Bread (cookout) |
| armour_set_pack | `lg`, `sk` | 58 | exclude | Adamant set (lg). Boxed armour sets |
| clue_tier | `beginner` … `master` | 46 | keep | Clue scroll (hard), Casket (elite). These are distinct items, but they look alike. A future "similar family" lever could cap them |
| gauntlet_tier | `basic`, `attuned`, `perfected` | 38 | collapse | Corrupted bow (perfected) |
| tier_n | `tier 1`–`tier 5` | 57 | collapse | Bounty hunter hat (tier 5), Archaic emblem (tier 5) |
| ale_maturity | `m`, `m1`–`m4` | 48 | collapse | Dwarven stout(m), Cider(m1) |
| enchanted_bolts | `e` | 33 | collapse | Diamond bolts (e). Also catches Catspeak amulet(e) and Blisterwood sickle (e) |
| watered_seedling | `w` | 24 | collapse | Apple seedling (w) |
| **unreviewed** | `c`, `cr`, `o`, `b` | 64 | keep | **Meaning varies per item**: Blade of Saeldor (c), Dragon claws (cr), Iban's staff (o), Maple blackjack(o), Soulreaper axe (o), Dragon hunter crossbow (b). Review these by hand before changing the mode |

Group counts overlap where suffixes stack, so they don't add up to the total.

The defaults reflect a principle: **collapse** a variant when it looks like the base and a player
can't reasonably tell them apart from the image. **Exclude** it when it looks different
(recolours, trims) but makes a worse answer than the base.

## Layer 2: notability tiers (planned)

This layer sorts the pool into easy, normal and hard tiers rather than deleting items.

- **GE trade volume:** the best "do players know this item?" signal for tradeables. The prices
  API returns volumes for all items in one request (`/1h` is documented; check whether a daily
  endpoint exists). This needs sign-off before fetching.
- **Equipment** (a row exists in `infobox_bonuses`) and slot.
- **Value / high alch.**
- **Quest-only** items lean hard.
- Untradeable famous items (pets, Fire cape, Void, etc.) have no GE data. They need a manual
  "famous untradeables" allowlist.

## Layer 3: visual distinctiveness and human review (planned)

- After detail images are downloaded, use a perceptual hash to flag near-identical images
  (recolours, dyed sets; 25 names share the Pink skirt icon) and keep one per group.
- A local review page with each image and keep/skip buttons. The automated layers should
  narrow the pool to about 1,000–2,000 candidates for this.

## Suggested build order

1. `scripts/build_pool.py`: Layer 1 plus variant levers from `config/item-pool.toml`. Local only.
2. Detail-image lookup (about 185 requests; **sign-off required**).
3. GE volumes (1 request; **sign-off required**), then compute tiers.
4. Download only shortlisted images with `scripts/fetch_item_image.py` (originals, not thumbnails).
5. Near-duplicate check, then the review page.
