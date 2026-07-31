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

### 📦 What I ship

`{{contributionsTotal}}` contributions across `{{repositoryCount}}` {{repositoryNoun}}, almost all private.<br>
`{{activeDays}}` of `{{calendarDays}}` days had at least one.<br>
{{languageOne}} · {{languageTwo}}<br>
{{shippingSparkline}}

<sub>rolling 365 days</sub>

### 🤖 What Claude ships for me

`{{claudeCoAuthored}}` of `{{claudeCommits}}` commits co-authored — `{{claudeShare}}`%<br>
`+{{linesAdded}}` / `−{{linesRemoved}}` lines<br>
{{modelOne}} · {{modelTwo}} · {{modelThree}}

I review all of it. Allegedly.

<sub>rolling 365 days</sub>

### 🎬 What I watch

`{{filmsRated}}` films rated · `{{filmsWatchlist}}` on the watchlist<br>
`{{filmsAverage}}` average — `{{filmsDelta}}` under IMDb on `{{filmsSample}}` shared titles<br>
`{{filmsTens}}` perfect `10`s in there

Statistically indistinguishable from everyone else. That's the joke.

<sub>as of {{filmsAsOf}}</sub>

### 💿 What I spin

`{{vinylRecords}}` records, `{{vinylShare}}`% vinyl<br>
{{genreOne}} · {{genreTwo}} · {{genreThree}}<br>
{{vinylArtists}} — `{{vinylArtistCount}}` each

{{?vinylGapDecades}}Nothing at all from the {{vinylGapDecades}}. No idea either.{{/}}{{?vinylNoGap}}Every decade since the `{{vinylFirstDecade}}`s, without a gap. Suspicious.{{/}}

<sub>collection as it stands</sub>

### 🌦☔️ Paris, mostly rain

`{{rainyDays}}` rainy days this year · `{{rainMillimetres}}` mm so far<br>
{{rainSparkline}}

Bio says "rain addict". The data agrees.

<sub>1 Jan → {{rainEndDate}} · a rainy day is ≥ 1 mm</sub>

### 🔗 Elsewhere

[Photographs](https://thibault.theologien.fr) · [LinkedIn](https://www.linkedin.com/in/thibault-theologien/) · [Aïstos](https://aistos.fr)

**[We're hiring →](https://aistos.fr)**

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
