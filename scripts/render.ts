import { format } from "date-fns";
import { z } from "zod";
import { fetchRain, fetchVinyl } from "./lib/sources";
import { sparkline } from "./lib/sparkline";
import { renderTemplate } from "./lib/template";

const ROOT = new URL("..", import.meta.url).pathname;
const DISCOGS_USER = "thblt_thlgn";
const SPARKLINE_COLUMNS = 12;

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

const zShape = z.object({
  models: z.number(),
  migrations: z.number(),
  gritRules: z.number(),
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

const languageLine = (
  languages: { name: string; share: number }[],
  index: number,
) => {
  const language = languages[index];
  if (language === undefined) {
    throw new Error(
      `languages: fewer than ${index + 1} languages were counted`,
    );
  }
  return `${language.name} \`${language.share}%\``;
};

const modelLine = (
  models: { name: string; commits: number }[],
  index: number,
) => {
  const model = models[index];
  if (model === undefined) {
    throw new Error(
      `claude: fewer than ${index + 1} models appear in the commit trailers`,
    );
  }
  return `${model.name} \`${number(model.commits)}\``;
};

/* A wide tie would produce a cell line long enough to force the two-column table
   to scroll on a phone, so the list is capped and the remainder counted. */
const ARTIST_LIMIT = 3;

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

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");
  /* Local layout iteration re-renders constantly and none of it depends on fresh
     records or rainfall, so --offline replays the last fetch instead of asking
     Discogs for the same 86 releases every time. Never used by the workflow. */
  const offline = process.argv.includes("--offline");
  const today = new Date();

  const shipping = await readData("shipping", zShipping);
  const claude = await readData("claude", zClaude);
  const shape = await readData("shape", zShape);
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
    models: number(shape.models),
    migrations: number(shape.migrations),
    gritRules: number(shape.gritRules),

    contributionsTotal: number(shipping.contributions.total),
    contributionsPrivate: number(shipping.contributions.private),
    activeDays: number(shipping.contributions.activeDays),
    calendarDays: number(shipping.contributions.calendarDays),
    /* The repositories actually committed to, not every one the App can read —
       "across 53 repositories" counts dormant side projects as places I work. */
    repositoryCount: number(shipping.repositories.active),
    repositoryNoun:
      shipping.repositories.active === 1 ? "repository" : "repositories",
    languageOne: languageLine(shipping.languages, 0),
    languageTwo: languageLine(shipping.languages, 1),
    shippingSparkline: sparkline({
      values: shipping.daily.map((day) => day.count),
      columns: SPARKLINE_COLUMNS,
      source: "shipping",
    }),

    claudeCommits: number(claude.commits.total),
    claudeCoAuthored: number(claude.commits.coAuthored),
    claudeShare: `${Math.round(claude.commits.share)}%`,
    linesAdded: number(claude.lines.added),
    linesRemoved: number(claude.lines.removed),
    modelOne: modelLine(claude.models, 0),
    modelTwo: modelLine(claude.models, 1),
    modelThree: modelLine(claude.models, 2),

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
    vinylNoGap: vinyl.gapDecades.length === 0 ? "yes" : "",
    vinylFirstDecade: String(vinyl.firstDecade),

    rainyDays: number(rain.rainyDays),
    rainMillimetres: rain.millimetres.toFixed(1),
    rainEndDate: format(new Date(`${rain.end}T00:00:00Z`), "d MMMM yyyy"),
    rainSparkline: sparkline({
      values: rain.daily,
      columns: SPARKLINE_COLUMNS,
      source: "open-meteo",
    }),

    renderedOn: format(today, "d MMMM yyyy"),
  };

  const template = await Bun.file(`${ROOT}template.md`).text();
  const readme = renderTemplate({ template, values });

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
