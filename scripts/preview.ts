import { mkdir, rm } from "node:fs/promises";
import { chromium } from "playwright-core";
import { z } from "zod";

/* The audit runs in the page and comes back as unknown, so it is validated like
   any other data crossing a boundary rather than asserted into shape. */
const zAudit = z.object({
  column: z.number(),
  height: z.number(),
  overflows: z.boolean(),
  overflowing: z.array(z.string()),
  statFills: z.array(z.object({ fill: z.number(), lines: z.number() })),
  links: z.array(z.string().nullable()),
  images: z.array(
    z.object({
      src: z.string().nullable(),
      natural: z.number(),
      rendered: z.number(),
    }),
  ),
});

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = `${ROOT}preview/`;

/* Measured on the live profile page: the readme column is 846px on desktop and
   343px inside a 375px phone. Asserting against those exact widths is the whole
   point — a layout that passes here cannot fail there. */
const VIEWS = [
  { name: "desktop", width: 846 },
  { name: "phone", width: 343 },
];
const THEMES = ["light", "dark"] as const;

/* A stat line that fills less than this much of the desktop column is the
   <br>-pinned shape that shipped twice: correct, and half a column of dead
   space. Naturally wrapped copy measures 92-99%. */
const MIN_DESKTOP_FILL = 85;

type Failure = { check: string; detail: string };

const renderMarkdown = async () => {
  const rendered =
    await Bun.$`bun run ${ROOT}scripts/render.ts --dry-run --offline`.text();
  if (rendered.trim() === "")
    throw new Error("preview: render produced nothing");
  return rendered;
};

/* WHY: GitHub's own endpoint, so this is the exact parse and the exact sanitizer
   the profile page applies — not a local approximation that could disagree about
   which HTML survives.

   mode MUST be "markdown", not "gfm". "gfm" is the comment flavour: it turns
   every soft newline into a <br>, which made this harness report 52-68% line
   fill for copy the live page renders at 92-99%. A README is a document. */
const toGitHubHtml = async (markdown: string) => {
  const token =
    process.env.GITHUB_TOKEN ?? (await Bun.$`gh auth token`.text()).trim();
  const response = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ text: markdown, mode: "markdown" }),
  });
  if (!response.ok) {
    throw new Error(
      `preview: /markdown → ${response.status} ${await response.text()}`,
    );
  }
  return response.text();
};

type PageProps = {
  html: string;
  theme: (typeof THEMES)[number];
  width: number;
};

const pageFor = ({ html, theme, width }: PageProps) => `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<base href="file://${ROOT}">
<link rel="stylesheet" href="file://${ROOT}node_modules/github-markdown-css/github-markdown-${theme}.css">
<style>
  :root { color-scheme: ${theme}; }
  body { margin: 0; padding: 24px; display: flex; justify-content: center;
         background: ${theme === "dark" ? "#0d1117" : "#ffffff"}; }
  .column { width: ${width}px; }
</style>
</head>
<body><div class="column"><article class="markdown-body">${html}</article></div></body>
</html>`;

const AUDIT = `(() => {
  const article = document.querySelector('article.markdown-body');
  const column = article.clientWidth;
  /* Rects are clustered by vertical midpoint, not by exact top: <sub> and <code>
     have their own font sizes, so a single visual line produces rects at several
     tops. Keying on top split those lines apart and under-reported the widest
     one by up to 40 points. */
  const LINE_TOLERANCE = 10;
  const lineFill = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()]
      .filter((r) => r.width > 0)
      .sort((a, b) => (a.top + a.bottom) / 2 - (b.top + b.bottom) / 2);
    const lines = [];
    for (const rect of rects) {
      const middle = (rect.top + rect.bottom) / 2;
      const current = lines[lines.length - 1];
      if (current && Math.abs(middle - current.middle) < LINE_TOLERANCE) {
        current.left = Math.min(current.left, rect.left);
        current.right = Math.max(current.right, rect.right);
      } else {
        lines.push({ middle, left: rect.left, right: rect.right });
      }
    }
    const widths = lines.map((l) => l.right - l.left);
    const fill = widths.length === 0 ? 0 : Math.round(Math.max(...widths) / column * 100);
    return { fill, lines: widths.length };
  };
  const statParagraphs = [...article.querySelectorAll('p')]
    .filter((p) => p.querySelector('code') && p.textContent.includes('\\u00b7'));
  return {
    column,
    height: Math.round(article.getBoundingClientRect().height),
    overflows: article.scrollWidth > article.clientWidth,
    overflowing: [...article.querySelectorAll('*')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
      .map((el) => el.tagName + (el.className ? '.' + el.className : '')),
    statFills: statParagraphs.map(lineFill),
    links: [...article.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    images: [...article.querySelectorAll('img')].map((i) => ({
      src: i.getAttribute('src'),
      natural: i.naturalWidth,
      rendered: Math.round(i.getBoundingClientRect().width),
    })),
  };
})()`;

const checkLinks = async (links: string[]) => {
  const failures: Failure[] = [];
  const external = [...new Set(links)].filter((href) =>
    href.startsWith("http"),
  );
  for (const href of external) {
    try {
      const response = await fetch(href, { method: "GET", redirect: "follow" });
      /* 999 is LinkedIn refusing a bot, not a dead link. */
      if (response.status >= 400 && response.status !== 999) {
        failures.push({
          check: "link",
          detail: `${href} → ${response.status}`,
        });
      }
    } catch (error) {
      console.log(
        `  ~ ${href} unreachable from here (${error instanceof Error ? error.message : "error"}) — not counted`,
      );
    }
  }
  return failures;
};

const main = async () => {
  const shouldCheckLinks = process.argv.includes("--check-links");
  const markdown = await renderMarkdown();
  const failures: Failure[] = [];

  if (/\{\{|\}\}/.test(markdown)) {
    failures.push({ check: "tokens", detail: "unsubstituted {{ }} in output" });
  }

  const html = await toGitHubHtml(markdown);
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  /* WHY channel: "chrome" — driving the Chrome already on the machine avoids
     playwright-core's ~150MB browser download, and it is the browser that
     actually renders the page for a reader. GitHub's ubuntu runners ship it too,
     so local and CI use the same engine. */
  const browser = await chromium.launch({ channel: "chrome" });
  let collectedLinks: string[] = [];

  for (const view of VIEWS) {
    for (const theme of THEMES) {
      const label = `${view.name}-${theme}`;
      const file = `${OUT}${label}.html`;
      await Bun.write(file, pageFor({ html, theme, width: view.width }));

      const page = await browser.newPage({
        viewport: { width: view.width + 48, height: 1200 },
        colorScheme: theme,
        deviceScaleFactor: 2,
      });
      await page.goto(`file://${file}`);
      const audit = zAudit.parse(await page.evaluate(AUDIT));
      await page.screenshot({ path: `${OUT}${label}.png`, fullPage: true });
      await page.close();

      collectedLinks = audit.links.filter(
        (href): href is string => href !== null,
      );

      if (audit.overflows || audit.overflowing.length > 0) {
        failures.push({
          check: `${label} overflow`,
          detail: `${audit.overflowing.length} element(s) wider than the column: ${audit.overflowing.slice(0, 3).join(", ")}`,
        });
      }

      if (view.name === "desktop") {
        /* Only paragraphs long enough to wrap three times are judged. A short
           one legitimately ends early; the failure this guards against is long
           copy pinned narrow by hard breaks, which always runs several lines. */
        const thin = audit.statFills.filter(
          (stat) => stat.lines >= 3 && stat.fill < MIN_DESKTOP_FILL,
        );
        if (thin.length > 0) {
          failures.push({
            check: `${label} density`,
            detail: `${thin.length} multi-line stat paragraph(s) below ${MIN_DESKTOP_FILL}% fill: ${thin.map((stat) => `${stat.fill}%`).join(", ")}`,
          });
        }
      }

      /* An <img> is scaled by GitHub's max-width:100%, so a wide SVG shown in a
         narrow column shrinks its text below legibility instead of reflowing. */
      for (const image of audit.images) {
        if (image.natural > 0 && image.rendered < image.natural * 0.9) {
          failures.push({
            check: `${label} image scaling`,
            detail: `${image.src} rendered at ${image.rendered}px from ${image.natural}px — text will shrink, needs a narrow variant`,
          });
        }
      }

      console.log(
        `  ${label.padEnd(16)} column ${String(audit.column).padStart(4)}px  height ${String(audit.height).padStart(5)}px  fills ${audit.statFills.map((x) => x.fill).join("/") || "-"}`,
      );
    }
  }
  await browser.close();

  if (shouldCheckLinks) failures.push(...(await checkLinks(collectedLinks)));

  console.log(`\n  screenshots → preview/`);
  if (failures.length === 0) {
    console.log("  ✅ all checks passed");
    return;
  }
  console.log(`\n  ❌ ${failures.length} check(s) failed`);
  for (const failure of failures) {
    console.log(`     ${failure.check}: ${failure.detail}`);
  }
  process.exitCode = 1;
};

await main();
