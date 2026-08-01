import { addDays, format, parseISO } from "date-fns";
import { z } from "zod";
import { cellsFor } from "./lib/grid-cells";
import { type ChartPoint, gridSvg } from "./lib/grid-svg";
import { fetchRain, fetchVinyl } from "./lib/sources";
import { renderTemplate } from "./lib/template";

const ROOT = new URL("..", import.meta.url).pathname;
const DISCOGS_USER = "thblt_thlgn";

const zShipping = z.object({
  contributions: z.object({
    total: z.number(),
    private: z.number(),
    activeDays: z.number(),
    calendarDays: z.number(),
  }),
  daily: z.array(z.object({ date: z.string(), count: z.number() })),
  repositories: z.object({ scanned: z.number(), active: z.number() }),
  languages: z.array(
    z.object({ name: z.string(), lines: z.number(), share: z.number() }),
  ),
});

const zClaude = z.object({
  commits: z.object({
    total: z.number(),
    coAuthored: z.number(),
    share: z.number(),
  }),
  lines: z.object({ added: z.number(), removed: z.number() }),
  models: z.array(z.object({ name: z.string(), commits: z.number() })),
});

const zFilms = z.object({
  asOf: z.string(),
  rated: z.number(),
  watchlist: z.number(),
  sample: z.object({
    titles: z.number(),
    averageRating: z.number(),
    imdbAverageRating: z.number(),
    distribution: z.record(z.string(), z.number()),
  }),
});

/* Only used by --offline, to replay a previous fetch. The live path takes these
   shapes straight from lib/sources, so these schemas exist to prove a cached
   file still matches rather than to define the shape. */
const zVinyl = z.object({
  records: z.number(),
  vinylShare: z.number(),
  genres: z.array(z.object({ name: z.string(), count: z.number() })),
  topArtists: z.array(z.string()),
  topArtistCount: z.number(),
  gapDecades: z.array(z.number()),
  firstDecade: z.number(),
});

const zRain = z.object({
  start: z.string(),
  end: z.string(),
  rainyDays: z.number(),
  millimetres: z.number(),
  daily: z.array(z.number()),
});

/* A file that is absent and a source that failed are different problems with
   different fixes, so they exit with different messages and neither ever
   degrades into a zero. */
const readData = async <T>(name: string, schema: z.ZodType<T>) => {
  const file = Bun.file(`${ROOT}data/${name}.json`);
  if (!(await file.exists())) {
    throw new Error(
      `bootstrap: data/${name}.json is missing — run the aggregate workflow first`,
    );
  }
  const $parsed = schema.safeParse(await file.json());
  if (!$parsed.success) {
    throw new Error(
      `data/${name}.json does not match the expected shape: ${$parsed.error.message}`,
    );
  }
  return $parsed.data;
};

const number = (value: number) => new Intl.NumberFormat("en-US").format(value);

/* A wide tie would produce a cell line long enough to force the two-column table
   to scroll on a phone, so the list is capped and the remainder counted. */
const ARTIST_LIMIT = 2;

const artistList = (artists: string[]) => {
  const shown = artists.slice(0, ARTIST_LIMIT).join(" · ");
  const rest = artists.length - ARTIST_LIMIT;
  return rest > 0 ? `${shown} and \`${rest}\` more` : shown;
};

const decadeList = (decades: number[]) => {
  const labels = decades.map((decade) => `\`${decade}\`s`);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} or the ${labels[labels.length - 1]}`;
};

/* Two widths, because an <img> is scaled by GitHub's max-width:100% rather than
   reflowed — a wide card shown in a phone column shrinks its text instead of
   rewrapping. 840 sits just inside the measured 846px desktop column and 343 is
   the phone column exactly, so neither variant is ever resampled. */
const WIDE = 840;
const NARROW = 343;

type GridProps = {
  values: Record<string, string>;
  languages: { name: string; share: number }[];
  activity: ChartPoint[];
  rain: ChartPoint[];
};

/* The month tick is attached to the first day of each month; the renderer places
   it without needing to know anything about dates. */
const toPoints = (series: { date: Date; value: number }[]): ChartPoint[] =>
  series.map(({ date, value }) =>
    date.getDate() === 1
      ? { value, month: `${format(date, "MMM").toLowerCase()}.` }
      : { value },
  );

const writeGrid = async (props: GridProps) => {
  const cells = cellsFor(props);
  for (const theme of ["light", "dark"] as const) {
    await Bun.write(
      `${ROOT}assets/grid-wide-${theme}.svg`,
      gridSvg({ cells, columns: 2, width: WIDE, theme }),
    );
    await Bun.write(
      `${ROOT}assets/grid-narrow-${theme}.svg`,
      gridSvg({ cells, columns: 1, width: NARROW, theme }),
    );
  }
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");
  /* Local layout iteration re-renders constantly and none of it depends on fresh
     records or rainfall, so --offline replays the last fetch instead of asking
     Discogs for the same 86 releases every time. Never used by the workflow. */
  const offline = process.argv.includes("--offline");
  const today = new Date();

  const shipping = await readData("shipping", zShipping);
  const claude = await readData("claude", zClaude);
  const films = await readData("films", zFilms);

  const vinyl = offline
    ? await readData("vinyl", zVinyl)
    : await fetchVinyl(DISCOGS_USER);
  const rain = offline ? await readData("rain", zRain) : await fetchRain(today);

  if (!offline) {
    await Bun.write(
      `${ROOT}data/vinyl.json`,
      `${JSON.stringify({ fetchedAt: today.toISOString(), ...vinyl }, null, 2)}\n`,
    );
    await Bun.write(
      `${ROOT}data/rain.json`,
      `${JSON.stringify({ fetchedAt: today.toISOString(), ...rain }, null, 2)}\n`,
    );
  }

  const tens = films.sample.distribution["10"];
  if (tens === undefined) {
    throw new Error("films: the sample distribution has no 10 bucket");
  }

  const genre = (index: number) => {
    const entry = vinyl.genres[index];
    if (entry === undefined) {
      throw new Error(
        `discogs: fewer than ${index + 1} genres in the collection`,
      );
    }
    return `${entry.name} \`${entry.count}\``;
  };

  const values: Record<string, string> = {
    contributionsTotal: number(shipping.contributions.total),
    contributionsPrivate: number(shipping.contributions.private),
    activeDays: number(shipping.contributions.activeDays),
    calendarDays: number(shipping.contributions.calendarDays),
    /* The repositories actually committed to, not every one the App can read —
       "across 53 repositories" counts dormant side projects as places I work. */
    repositoryCount: number(shipping.repositories.active),
    repositoryNoun:
      shipping.repositories.active === 1 ? "repository" : "repositories",

    claudeCommits: number(claude.commits.total),
    claudeCoAuthored: number(claude.commits.coAuthored),
    claudeShare: `${Math.round(claude.commits.share)}%`,
    linesAdded: number(claude.lines.added),
    linesRemoved: number(claude.lines.removed),

    filmsRated: number(films.rated),
    filmsWatchlist: number(films.watchlist),
    filmsAverage: films.sample.averageRating.toFixed(2),
    filmsDelta: (
      films.sample.imdbAverageRating - films.sample.averageRating
    ).toFixed(2),
    filmsSample: number(films.sample.titles),
    filmsTens: number(tens),
    filmsAsOf: films.asOf,

    vinylRecords: number(vinyl.records),
    vinylShare: `${vinyl.vinylShare}%`,
    genreOne: genre(0),
    genreTwo: genre(1),
    genreThree: genre(2),
    vinylArtists: artistList(vinyl.topArtists),
    vinylArtistCount: number(vinyl.topArtistCount),
    vinylGapDecades: decadeList(vinyl.gapDecades),

    rainyDays: number(rain.rainyDays),
    rainMillimetres: rain.millimetres.toFixed(1),
    rainEndDate: format(new Date(`${rain.end}T00:00:00Z`), "d MMMM yyyy"),

  };

  const need = (key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`render: no value for ${key}`);
    return value;
  };

  await writeGrid({
    values,
    languages: shipping.languages,
    activity: toPoints(
      shipping.daily.map((day) => ({ date: parseISO(day.date), value: day.count })),
    ),
    rain: toPoints(
      rain.daily.map((value, index) => ({
        date: addDays(parseISO(rain.start), index),
        value,
      })),
    ),
  });

  /* Only what the markdown itself renders. Every other figure now lives in the
     SVG, and handing them all to renderTemplate would trip its own guard that a
     computed value must be consumed — the guard is right, the values moved. */
  const templateValues: Record<string, string> = {
    contributionsTotal: need("contributionsTotal"),
    contributionsPrivate: need("contributionsPrivate"),
    /* Busts GitHub image caching, which keys on the URL: the file changes
       nightly but assets/grid-wide-light.svg does not. */
    assetVersion: format(today, "yyyyMMdd"),
    /* The grid is an image, so this alt text is the only form these numbers take
       for a screen reader or a search engine. */
    gridAlt: [
      `${need("contributionsTotal")} contributions across ${need("repositoryCount")} repositories, almost all private.`,
      `${need("claudeCoAuthored")} of my ${need("claudeCommits")} commits were co-authored with Claude (${need("claudeShare")}).`,
      `${need("filmsRated")} films rated, ${need("vinylRecords")} records, ${need("rainyDays")} rainy days in Paris this year.`,
    ].join(" "),
  };

  const template = await Bun.file(`${ROOT}template.md`).text();
  const readme = renderTemplate({ template, values: templateValues });

  if (dryRun) {
    process.stdout.write(readme);
    return;
  }
  await Bun.write(`${ROOT}README.md`, readme);
  console.log(`wrote README.md (${readme.length} bytes)`);
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("README.md was left untouched.");
  process.exit(1);
}
