**Thibault Théologien** · CTO [@Aïstos](https://aistos.fr) · Paris

I build debt-collection software that tries hard not to be unpleasant about it.

Today that is `54` data models · `215` migrations · `13` custom lint
rules whose only job is stopping AI agents from repeating a mistake.

Of the `4,625` contributions on this profile in the past year,
`4,616` are anonymous green squares. You'll have to take my word for it —
*ou me croire sur parole.*

|  |  |
| :-- | :-- |
| <h3>📦 What I ship</h3> `4,625` contributions <br> `226` of `366` active days <br> TypeScript `84.1`% <br> Vue `7.8`% <br> ▁▂▄▅▄▄▅▄▃▃▆█ <br><br> Across `53` repositories. Almost all of it private. <br> <sub>rolling 365 days</sub> | <h3>🤖 What Claude ships for me</h3> `2,852` of `8,620` commits co-authored — `33`% <br> `+422,270` / `−186,763` <br><br> Opus 4.8 `1,223` <br> Opus 4.6 `790` <br> Opus 4.7 `259` <br><br> I review all of it. Allegedly. <br> <sub>rolling 365 days</sub> |
| <h3>🎬 What I watch</h3> `1,103` films rated <br> `677` on the watchlist <br> `7.09` avg — `0.07` under <br> IMDb on `250` shared titles <br> `2` perfect `10`s in there <br><br> Statistically indistinguishable from everyone else. That's the joke. <br> <sub>as of July 2026</sub> | <h3>💿 What I spin</h3> `86` records, `100`% vinyl <br> Rock `54` · Pop `22` <br> Funk / Soul `20` <br> Dire Straits · Fleetwood Mac · Michael Kiwanuka — `4` each <br><br> Nothing at all from the `1990`s. No idea either. <br> <sub>collection as it stands</sub> |
| <h3>🌦☔️ Paris, mostly rain</h3> `74` rainy days this year <br> `448.9` mm so far <br> ▄▅█▃▂▂▄▆▃▂▂▁ <br><br> Bio says "rain addict". The data agrees. <br> <sub>1 Jan → 28 July 2026 · a rainy day is ≥ 1 mm</sub> | <h3>🔗 Elsewhere</h3> [Photographs](https://thibault.theologien.fr) <br> [LinkedIn](https://www.linkedin.com/in/thibault-theologien/) <br> [Aïstos](https://aistos.fr) <br><br> [We're hiring →](https://aistos.fr) |

We're hiring in Paris — Senior Fullstack TypeScript (full-remote possible) and a Product Owner.
Come build the review-driven learning system for our AI agents. → [aistos.fr](https://aistos.fr)

<sub>Rebuilt nightly by GitHub Actions · [How this works](#how-this-works) · as of 31 July 2026</sub>

## How this works

Everything above is measured, nightly, and nothing runs on my laptop.

A private repository holds a GitHub App key, reads the repositories the App is installed on — almost
all of them private — and computes three things: what GitHub counts as my contributions, what the
`Co-Authored-By: Claude` trailers in my commit history add up to, and the structural shape of the
platform I work on. It commits the result and pushes a copy here. This repository then fetches my
[Discogs](https://www.discogs.com/user/thblt_thlgn) collection and Paris rainfall from
[Open-Meteo](https://open-meteo.com), renders `template.md`, and commits the README.

Three deliberate choices:

- **No stat-card images.** Services like `github-readme-stats` see only public repositories, which
  is a rounding error here — and they would headline JavaScript on the strength of side projects
  from 2019, while the codebase I actually work in contains almost none. Everything on this page is
  text, sparklines included.
- **Every window is labelled.** Activity figures are a rolling 365 days, structural counts are a
  snapshot of today, rainfall is calendar-year-to-date. Mixing those denominators is how a
  dashboard ends up quietly contradicting itself.
- **Nothing falls back to a plausible number.** If a source fails, the render aborts and names it,
  and yesterday's README stays up. A figure on this page is either measured or absent.

The one exception is the film block: IMDb has no ratings API, its RSS feeds are deprecated and its
`robots.txt` disallows crawling, so those figures are frozen and the cell says so.
