import { format, startOfYear, subDays } from "date-fns";
import { z } from "zod";

const USER_AGENT = "thblt-thlgn-profile/1.0 (+https://github.com/thblt-thlgn)";

type FetchJsonProps = { source: string; url: string };

const fetchJson = async ({ source, url }: FetchJsonProps) => {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `${source}: ${url} → ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
};

const zDiscogsPage = z.object({
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    items: z.number(),
  }),
  releases: z.array(
    z.object({
      basic_information: z.object({
        year: z.number(),
        formats: z.array(z.object({ name: z.string() })),
        genres: z.array(z.string()),
        artists: z.array(z.object({ name: z.string() })),
      }),
    }),
  ),
});

/* Discogs disambiguates same-named artists with a numeric suffix ("Nirvana (2)"),
   which is catalogue metadata rather than part of the name. */
const cleanArtist = (name: string) => name.replace(/\s*\(\d+\)\s*$/, "").trim();

const tally = (counts: Map<string, number>, key: string) =>
  counts.set(key, (counts.get(key) ?? 0) + 1);

export const fetchVinyl = async (username: string) => {
  const source = "discogs";
  const releases: z.infer<typeof zDiscogsPage>["releases"] = [];
  let page = 1;
  let pages = 1;

  while (page <= pages) {
    const body = zDiscogsPage.parse(
      await fetchJson({
        source,
        url: `https://api.discogs.com/users/${username}/collection/folders/0/releases?per_page=100&page=${page}`,
      }),
    );
    releases.push(...body.releases);
    pages = body.pagination.pages;
    page += 1;
  }

  if (releases.length === 0) {
    throw new Error(`${source}: the collection came back empty`);
  }

  const genres = new Map<string, number>();
  const artists = new Map<string, number>();
  const decades = new Map<number, number>();
  let vinyl = 0;

  for (const { basic_information: info } of releases) {
    if (info.formats.some((entry) => entry.name === "Vinyl")) vinyl += 1;
    for (const genre of info.genres) tally(genres, genre);
    for (const artist of info.artists) tally(artists, cleanArtist(artist.name));
    if (info.year > 0) {
      const decade = Math.floor(info.year / 10) * 10;
      decades.set(decade, (decades.get(decade) ?? 0) + 1);
    }
  }

  const decadeYears = [...decades.keys()].sort((left, right) => left - right);
  const first = decadeYears[0];
  const last = decadeYears[decadeYears.length - 1];
  if (first === undefined || last === undefined) {
    throw new Error(`${source}: no release carried a usable year`);
  }

  /* A decade with no records is only meaningful as a genuine gap between two
     decades that do have records, never as an absence of data. */
  const gaps: number[] = [];
  for (let decade = first; decade <= last; decade += 10) {
    if ((decades.get(decade) ?? 0) === 0) gaps.push(decade);
  }

  const peak = Math.max(...artists.values());

  return {
    records: releases.length,
    vinyl,
    vinylShare: Math.round((vinyl / releases.length) * 100),
    genres: [...genres]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count),
    topArtists: [...artists]
      .filter(([, count]) => count === peak)
      .map(([name]) => name)
      .sort(),
    topArtistCount: peak,
    decades: Object.fromEntries(
      decadeYears.map((decade) => [decade, decades.get(decade) ?? 0]),
    ),
    gapDecades: gaps,
    firstDecade: first,
  };
};

const zArchive = z.object({
  daily_units: z.object({ precipitation_sum: z.string() }),
  daily: z.object({
    time: z.array(z.string()),
    precipitation_sum: z.array(z.number().nullable()),
  }),
});

const RAINY_DAY_MILLIMETRES = 1;

/* The archive trails real time by a few days, so the window deliberately stops
   short and the page says "so far this year" rather than "as of today". */
const ARCHIVE_LAG_DAYS = 3;

export const fetchRain = async (today: Date) => {
  const source = "open-meteo";
  const start = format(startOfYear(today), "yyyy-MM-dd");
  const end = format(subDays(today, ARCHIVE_LAG_DAYS), "yyyy-MM-dd");

  const body = zArchive.parse(
    await fetchJson({
      source,
      url: `https://archive-api.open-meteo.com/v1/archive?latitude=48.8566&longitude=2.3522&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=Europe%2FParis`,
    }),
  );

  if (body.daily_units.precipitation_sum !== "mm") {
    throw new Error(
      `${source}: precipitation unit is ${body.daily_units.precipitation_sum}, expected mm`,
    );
  }

  const series = body.daily.precipitation_sum;
  const measured = series.filter((value) => value !== null);
  if (measured.length === 0) {
    throw new Error(`${source}: every day in the window is null`);
  }

  const total = measured.reduce((sum, value) => sum + value, 0);
  return {
    start,
    end,
    days: series.length,
    missingDays: series.length - measured.length,
    rainyDays: measured.filter((value) => value >= RAINY_DAY_MILLIMETRES)
      .length,
    daysWithAnyRain: measured.filter((value) => value > 0).length,
    millimetres: Math.round(total * 10) / 10,
    wettestDay: Math.max(...measured),
    rainyDayThresholdMm: RAINY_DAY_MILLIMETRES,
    daily: series.map((value) => value ?? 0),
  };
};
