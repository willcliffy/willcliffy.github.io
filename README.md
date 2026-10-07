# OSRS Item Guesser

A daily, NYT-style guessing game about items from Old School RuneScape.

## Premise

1. You're shown a **heavily blurred image** of an OSRS item.
2. **Click one tile** on the image to reveal that part at full clarity.
3. **Guess** which item it is.
4. After each guess you get **feedback on how close you were**. The first idea is a percentage
   "closeness" bar. Other grading schemes are still on the table (see below).
5. You get **6 guesses**, so you can reveal up to **6 tiles**. Each guess earns one reveal.

Everyone gets the same item each day, and you can share a spoiler-free result grid afterwards,
like Wordle.

## Open design questions

- **Grading:** a single "% close" score or Wordle-style hint columns (slot, members, release
  year, value higher/lower, etc.)? The available data supports either. See
  [docs/data-sourcing-research.md](docs/data-sourcing-research.md#7-data-for-grading-closeness).
- **Grid size:** the prototype defaults to 10×10. Even small tiles give away a lot. Still open:
  whether to show the blur at all once tiles have been revealed.
- **Item pool:** which items can be answers. The plan and analysis are in
  [docs/item-pool-filtering.md](docs/item-pool-filtering.md). The adjustable levers (variant
  groups etc.) are in [config/item-pool.toml](config/item-pool.toml).

## Data and assets

The game uses item data and imagery from the [Old School RuneScape Wiki](https://oldschool.runescape.wiki)
(CC BY-NC-SA 3.0). Everything is fetched by an **offline build script** and served as static
files, so players' page loads never hit the wiki. The full research, policies, and the
recommended pipeline are in [docs/data-sourcing-research.md](docs/data-sourcing-research.md).

## Legal

This is a non-commercial fan project.

> Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan
> Content Policy. This content is not endorsed by or affiliated with Jagex.

Item data and images come from the [Old School RuneScape Wiki](https://oldschool.runescape.wiki)
and are used under [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/).
Game images are © Jagex Ltd.
