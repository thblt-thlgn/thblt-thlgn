<!--
  This file is the copy. scripts/render.ts substitutes every {{ token }} and writes README.md.

  Rules the renderer enforces, so you can edit freely here:
    - a {{ token }} with no computed value aborts the render; the README is left untouched
    - a computed value no template token consumes also aborts, so a figure cannot go missing quietly
    - {{?token}}…{{/}} keeps that segment only when the token has a non-empty value

  Do not edit README.md — it is generated.
-->

<!-- block:header -->

**Thibault Théologien** · CTO [@Aïstos](https://aistos.fr) · Paris

I build debt-collection software that tries hard not to be unpleasant about it.

Today that is `{{models}}` data models · `{{migrations}}` migrations · `{{gritRules}}` custom lint
rules whose only job is stopping AI agents from repeating a mistake.

Of the `{{contributionsTotal}}` contributions on this profile in the past year,
`{{contributionsPrivate}}` are anonymous green squares. You'll have to take my word for it —
*ou me croire sur parole.*

<!-- block:grid -->

|  |  |
| :-- | :-- |
| <h3>📦 What I ship</h3> `{{contributionsTotal}}` contributions <br> `{{activeDays}}` of `{{calendarDays}}` active days <br> {{languageOne}} <br> {{languageTwo}} <br> {{shippingSparkline}} <br><br> Across `{{repositoryCount}}` {{repositoryNoun}}. Almost all of it private. <br> <sub>rolling 365 days</sub> | <h3>🤖 What Claude ships for me</h3> `{{claudeCoAuthored}}` of `{{claudeCommits}}` commits co-authored — `{{claudeShare}}`% <br> `+{{linesAdded}}` / `−{{linesRemoved}}` <br><br> {{modelOne}} <br> {{modelTwo}} <br> {{modelThree}} <br><br> I review all of it. Allegedly. <br> <sub>rolling 365 days</sub> |
| <h3>🎬 What I watch</h3> `{{filmsRated}}` films rated <br> `{{filmsWatchlist}}` on the watchlist <br> `{{filmsAverage}}` avg — `{{filmsDelta}}` under <br> IMDb on `{{filmsSample}}` shared titles <br> `{{filmsTens}}` perfect `10`s in there <br><br> Statistically indistinguishable from everyone else. That's the joke. <br> <sub>as of {{filmsAsOf}}</sub> | <h3>💿 What I spin</h3> `{{vinylRecords}}` records, `{{vinylShare}}`% vinyl <br> {{genreOne}} · {{genreTwo}} <br> {{genreThree}} <br> {{vinylArtists}} — `{{vinylArtistCount}}` each <br><br> {{?vinylGapDecades}}Nothing at all from the {{vinylGapDecades}}. No idea either.{{/}}{{?vinylNoGap}}Every decade since the `{{vinylFirstDecade}}`s, without a gap. Suspicious.{{/}} <br> <sub>collection as it stands</sub> |
| <h3>🌦☔️ Paris, mostly rain</h3> `{{rainyDays}}` rainy days this year <br> `{{rainMillimetres}}` mm so far <br> {{rainSparkline}} <br><br> Bio says "rain addict". The data agrees. <br> <sub>1 Jan → {{rainEndDate}} · a rainy day is ≥ 1 mm</sub> | <h3>🔗 Elsewhere</h3> [Photographs](https://thibault.theologien.fr) <br> [LinkedIn](https://www.linkedin.com/in/thibault-theologien/) <br> [Aïstos](https://aistos.fr) <br><br> [We're hiring →](https://aistos.fr) |

<!-- block:footer -->

We're hiring in Paris — Senior Fullstack TypeScript (full-remote possible) and a Product Owner.
Come build the review-driven learning system for our AI agents. → [aistos.fr](https://aistos.fr)

<sub>Rebuilt nightly by GitHub Actions · [How this works](#how-this-works) · as of {{renderedOn}}</sub>

<!-- block:colophon -->

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
