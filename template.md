<!--
  This file is the copy. scripts/render.ts substitutes every {{ token }} and writes README.md.

  Rules the renderer enforces, so you can edit freely here:
    - a {{ token }} with no computed value aborts the render; the README is left untouched
    - a computed value no template token consumes also aborts, so a figure cannot go missing quietly
    - {{?token}}…{{/}} keeps that segment only when the token has a non-empty value

  LAYOUT RULE — read before editing the grid.
  GitHub strips CSS, so there is no media query: one layout serves 375px and desktop alike. The
  two-column table works only while every cell line stays under ~26 characters, because at 375px
  each column is ~160px. Measured: at 26 chars the grid holds; the same cells written as full
  sentences wrapped four to five times and the page ran twice as tall. Keep cell lines short and
  telegraphic. Prose belongs in the header and the kickers, never in a stat line.

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
| <h3>📦 What I ship</h3> `{{contributionsTotal}}` contributions <br> `{{activeDays}}` of `{{calendarDays}}` active days <br> {{languageOne}} <br> {{languageTwo}} <br> {{shippingSparkline}} <br><br> Across `{{repositoryCount}}` {{repositoryNoun}}. <br> Almost all of it private. <br><br> <sub>rolling 365 days</sub> | <h3>🤖 What Claude ships</h3> `{{claudeCoAuthored}}` of `{{claudeCommits}}` commits <br> co-authored — `{{claudeShare}}` <br> `+{{linesAdded}}` / `−{{linesRemoved}}` <br><br> {{modelOne}} <br> {{modelTwo}} <br> {{modelThree}} <br><br> I review all of it. Allegedly. <br><br> <sub>rolling 365 days</sub> |
| <h3>🎬 What I watch</h3> `{{filmsRated}}` films rated <br> `{{filmsWatchlist}}` on the watchlist <br> `{{filmsAverage}}` avg — `{{filmsDelta}}` under <br> IMDb on `{{filmsSample}}` titles <br> only `{{filmsTens}}` scored `10` <br><br> Statistically indistinguishable from everyone else. That's the joke. <br><br> <sub>as of {{filmsAsOf}}</sub> | <h3>💿 What I spin</h3> `{{vinylRecords}}` records, `{{vinylShare}}` vinyl <br> {{genreOne}} · {{genreTwo}} <br> {{genreThree}} <br> {{vinylArtists}} <br> at `{{vinylArtistCount}}` each <br><br> {{?vinylGapDecades}}Nothing at all from the {{vinylGapDecades}}. No idea either.{{/}}{{?vinylNoGap}}Every decade since the `{{vinylFirstDecade}}`s. Suspicious.{{/}} <br><br> <sub>collection as it stands</sub> |
| <h3>🌦☔️ Paris, mostly rain</h3> `{{rainyDays}}` rainy days this year <br> `{{rainMillimetres}}` mm so far <br> {{rainSparkline}} <br><br> Bio says "rain addict". The data agrees. <br><br> <sub>1 Jan → {{rainEndDate}}</sub> <br> <sub>a rainy day is ≥ 1 mm</sub> | <h3>🔗 Elsewhere</h3> [Photographs](https://thibault.theologien.fr) <br> [LinkedIn](https://www.linkedin.com/in/thibault-theologien/) <br> [Aïstos](https://aistos.fr) <br><br> **[We're hiring →](https://www.linkedin.com/company/aistos/jobs/)** |

<!-- block:footer -->

**We're hiring in Paris** — Senior Fullstack TypeScript (full-remote possible) and a Product Owner.
Come build the review-driven learning system for our AI agents. →
[our openings](https://www.linkedin.com/company/aistos/jobs/)

<sub>Rebuilt nightly by GitHub Actions from my own commit history, Discogs and Open-Meteo · as of
{{renderedOn}}</sub>
