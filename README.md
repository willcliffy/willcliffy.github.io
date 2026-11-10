# OSRS Progression

A static page for tracking Old School RuneScape progress: skills and max cape, Quest Cape skill requirements, Achievement Diary (elite) requirements, boss kill counts, XP gains over time, and comparing two players.

Data comes from the [Wise Old Man](https://wiseoldman.net) API. Looking up a player it doesn't track yet starts tracking them.

## Run locally
ES modules need a server (opening the file directly won't work):

```sh
npx serve .        # or: python -m http.server
```

Link to a player with `?player=<name>`.

## Deploy
Any static host works (GitHub Pages, Netlify, Cloudflare Pages). No build step.

Requirement data lives in `data.js`.
