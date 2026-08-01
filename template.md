<!--
  This file is the copy. scripts/render.ts substitutes every {{ token }} and writes README.md.

  Rules the renderer enforces, so you can edit freely here:
    - a {{ token }} with no computed value aborts the render; the README is left untouched
    - a computed value no template token consumes also aborts, so a figure cannot go missing quietly
    - {{?token}}…{{/}} keeps that segment only when the token has a non-empty value

  LAYOUT - the grid is an SVG, not a table. Three things were measured, so none needs retrying.

  1. A markdown table cannot hold the grid. At 375px the readme column is ~343px, GitHub splits
     two columns unevenly (~200/~130px), <code> padding cuts the real budget to ~18 characters,
     and <td> defaults to vertical-align:middle - which GitHub does not override - so the shorter
     cell floats mid-height. Tried twice.
  2. Inline <svg> is stripped by GitHub's sanitiser. The grid must be an <img>, which means its
     text is not selectable and its links are not clickable. Every link therefore lives in the
     markdown below the image, never inside it.
  3. <source media="(max-width: …)"> DOES survive the sanitiser, so the wide and narrow cards are
     swapped by the browser. This is the only genuinely responsive mechanism GitHub allows - an
     <img> is scaled by max-width:100%, so a single wide card would shrink its text on a phone
     rather than reflow. Verified against GitHub's own /markdown endpoint.

  Run `bun run preview --open` before pushing. It renders through that same endpoint and measures
  the result in Chrome at both widths in both themes.

  Do not edit README.md - it is generated.
-->

<!-- block:header -->

I build debt-collection software that tries hard not to be unpleasant about it.

Of the `{{contributionsTotal}}` contributions on this profile in the past year,
`{{contributionsPrivate}}` are anonymous green squares. You'll have to take my word for it -
*ou me croire sur parole.*

<!-- block:grid -->

<br>

<picture>
  <source media="(max-width: 500px) and (prefers-color-scheme: dark)" srcset="assets/grid-narrow-dark.svg?v={{assetVersion}}">
  <source media="(max-width: 500px)" srcset="assets/grid-narrow-light.svg?v={{assetVersion}}">
  <source media="(prefers-color-scheme: dark)" srcset="assets/grid-wide-dark.svg?v={{assetVersion}}">
  <img alt="{{gridAlt}}" src="assets/grid-wide-light.svg?v={{assetVersion}}" width="840">
</picture>

<!-- block:footer -->

<br><br><br>

**We're hiring in Paris** - Senior Fullstack TypeScript (full-remote possible) and a Product Owner.
Come build the review-driven learning system for our AI agents. →
[our openings](https://www.linkedin.com/company/aistos/jobs/)

<!--
  Real favicons, fetched once and committed rather than hot-linked. A live badge
  or favicon service would be a third-party uptime dependency that renders as a
  broken image the day it goes down, for decoration.
-->
[<img src="assets/icons/photographs.png" width="14" height="14"> Photographs](https://thibault.theologien.fr) ·
[<img src="assets/icons/linkedin.png" width="14" height="14"> LinkedIn](https://www.linkedin.com/in/thibault-theologien/) ·
[<img src="assets/icons/aistos.png" width="14" height="14"> Aïstos](https://aistos.fr)
