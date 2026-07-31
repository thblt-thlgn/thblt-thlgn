<!--
  This file is the copy. scripts/render.ts substitutes every {{ token }} and writes README.md.

  Rules the renderer enforces, so you can edit freely here:
    - a {{ token }} with no computed value aborts the render; the README is left untouched
    - a computed value no template token consumes also aborts, so a figure cannot go missing quietly
    - {{?token}}…{{/}} keeps that segment only when the token has a non-empty value

  Layout note: do NOT reintroduce <br>. GitHub strips CSS, so natural text wrapping is the only
  responsive mechanism available — a hard break pins every line to one width. Measured on the live
  page: paragraphs that wrap naturally fill 95-99% of the column, the same copy broken with <br>
  filled 37-48% and ran twice as tall. Separate facts with · and let them flow.

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

<!-- block:sections -->

### 📦 What I ship

`{{contributionsTotal}}` contributions across `{{repositoryCount}}` {{repositoryNoun}}, almost all
private · `{{activeDays}}` of `{{calendarDays}}` days had at least one · {{languageOne}} ·
{{languageTwo}} · {{shippingSparkline}} · <sub>rolling 365 days</sub>

### 🤖 What Claude ships for me

`{{claudeCoAuthored}}` of `{{claudeCommits}}` commits co-authored — `{{claudeShare}}`% ·
`+{{linesAdded}}` / `−{{linesRemoved}}` lines · {{modelOne}} · {{modelTwo}} · {{modelThree}} ·
<sub>rolling 365 days</sub>

I review all of it. Allegedly.

### 🎬 What I watch

`{{filmsRated}}` films rated · `{{filmsWatchlist}}` on the watchlist · `{{filmsAverage}}` average,
`{{filmsDelta}}` under IMDb on `{{filmsSample}}` shared titles · `{{filmsTens}}` perfect `10`s in
there · <sub>as of {{filmsAsOf}}</sub>

Statistically indistinguishable from everyone else. That's the joke.

### 💿 What I spin

`{{vinylRecords}}` records, `{{vinylShare}}`% vinyl · {{genreOne}} · {{genreTwo}} · {{genreThree}} ·
{{vinylArtists}} at `{{vinylArtistCount}}` each · <sub>collection as it stands</sub>

{{?vinylGapDecades}}Nothing at all from the {{vinylGapDecades}}. No idea either.{{/}}{{?vinylNoGap}}Every decade since the `{{vinylFirstDecade}}`s, without a gap. Suspicious.{{/}}

### 🌦☔️ Paris, mostly rain

`{{rainyDays}}` rainy days this year · `{{rainMillimetres}}` mm so far · {{rainSparkline}} ·
<sub>1 Jan → {{rainEndDate}}, a rainy day is ≥ 1 mm</sub>

Bio says "rain addict". The data agrees.

### 🔗 Elsewhere

[Photographs](https://thibault.theologien.fr) ·
[LinkedIn](https://www.linkedin.com/in/thibault-theologien/) · [Aïstos](https://aistos.fr)

<!-- block:footer -->

**We're hiring in Paris** — Senior Fullstack TypeScript (full-remote possible) and a Product Owner.
Come build the review-driven learning system for our AI agents. →
[our openings](https://www.linkedin.com/company/aistos/jobs/)

<sub>Rebuilt nightly by GitHub Actions from my own commit history, Discogs and Open-Meteo · as of
{{renderedOn}}</sub>
