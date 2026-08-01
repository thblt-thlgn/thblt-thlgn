import { type Cell, type Run } from "./grid-svg";

type CellsProps = {
  values: Record<string, string>;
  languages: { name: string; share: number }[];
  activity: number[];
  rain: number[];
};

const figure = (text: string): Run => ({ text, kind: "figure" });
const label = (text: string): Run => ({ text, kind: "label" });
const plain = (value: string) => label(value.replace(/`/g, ""));

export const cellsFor = ({
  values,
  languages,
  activity,
  rain,
}: CellsProps): Cell[] => {
  /* The markdown template proves every token it renders was computed; the card
     needs the same guarantee, so a missing value throws rather than drawing an
     empty string into the grid. */
  const need = (key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`grid: no value for ${key}`);
    return value;
  };
  const gapDecades = need("vinylGapDecades").replace(/`/g, "");
  const language = (index: number) => {
    const entry = languages[index];
    if (entry === undefined) {
      throw new Error(`grid: fewer than ${index + 1} languages counted`);
    }
    return entry;
  };

  return [
    {
      emoji: "📦",
      title: "What I ship",
      lines: [
        [
          figure(need("contributionsTotal")),
          label(" contributions across "),
          figure(need("repositoryCount")),
          label(` ${need("repositoryNoun")}`),
        ],
        [
          figure(need("activeDays")),
          label(" of "),
          figure(need("calendarDays")),
          label(" days had at least one"),
        ],
        [
          label(`${language(0).name} `),
          figure(`${language(0).share}%`),
          label(`  ·  ${language(1).name} `),
          figure(`${language(1).share}%`),
        ],
      ],
      accent: "green",
      chart: { values: activity, tone: "activity" },
      kicker: "Almost all of it private.",
    },
    {
      emoji: "🤖",
      title: "What Claude ships",
      lines: [
        [
          figure(need("claudeCoAuthored")),
          label(" of "),
          figure(need("claudeCommits")),
          label(" of my commits"),
        ],
        [figure(need("claudeShare")), label(" co-authored")],
        [
          { text: `+${need("linesAdded")}`, kind: "up" },
          label("  /  "),
          { text: `−${need("linesRemoved")}`, kind: "down" },
          label(" lines"),
        ],
      ],
      accent: "purple",
      kicker: "I review all of it. Allegedly.",
    },
    {
      emoji: "🎬",
      title: "What I watch",
      lines: [
        [figure(need("filmsRated")), label(" films rated")],
        [figure(need("filmsWatchlist")), label(" on the watchlist")],
        [
          figure(need("filmsAverage")),
          label(" average — "),
          figure(need("filmsDelta")),
          label(" under IMDb"),
        ],
        [
          label("only "),
          figure(need("filmsTens")),
          label(" scored "),
          figure("10"),
          label(` of ${need("filmsSample")}`),
        ],
      ],
      accent: "amber",
      kicker: "Indistinguishable from everyone else.",
    },
    {
      emoji: "💿",
      title: "What I spin",
      lines: [
        [
          figure(need("vinylRecords")),
          label(" records, "),
          figure(need("vinylShare")),
          label(" vinyl"),
        ],
        [plain(`${need("genreOne")}  ·  ${need("genreTwo")}`)],
        [plain(need("genreThree"))],
        [plain(need("vinylArtists"))],
        [label("at "), figure(need("vinylArtistCount")), label(" records each")],
      ],
      accent: "pink",
      /* Data-driven: an empty gap list means the collection filled in, and the
         line would otherwise keep claiming a hole that closed. */
      kicker:
        gapDecades === ""
          ? "Every decade covered, without a gap."
          : `Nothing at all from the ${gapDecades}.`,
    },
    {
      emoji: "🌦",
      title: "Paris, mostly rain",
      lines: [
        [figure(need("rainyDays")), label(" rainy days this year")],
        [figure(need("rainMillimetres")), label(" mm so far")],
      ],
      accent: "blue",
      chart: { values: rain, tone: "rain" },
      /* Odd cell out: spans the row so the grid has no empty slot, and the wide
         panel is where the year of rainfall actually has room to read. */
      span: true,
      kicker: '"Rain addict", says the bio. The data agrees.',
    },
  ];
};
