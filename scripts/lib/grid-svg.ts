export type Run = {
  text: string;
  kind: "label" | "figure" | "up" | "down";
};

export type Cell = {
  emoji: string;
  title: string;
  lines: Run[][];
  chart?: { values: number[]; tone: "activity" | "rain" };
  kicker?: string;
  caption: string;
};

export type Theme = "light" | "dark";

/* Figures are deliberately NOT the link blue — on a page whose only other accent
   is a hyperlink, a blue number reads as clickable. Emphasis comes from weight
   and from dimming everything around them instead. Green and red are reserved
   for added and removed lines, where the colour carries the meaning. */
const PALETTE = {
  light: {
    figure: "#1f2328",
    label: "#656d76",
    dim: "#818b98",
    up: "#1a7f37",
    down: "#cf222e",
    activity: "#40c463",
    rain: "#54aeff",
  },
  dark: {
    figure: "#f0f6fc",
    label: "#b1bac4",
    dim: "#8d96a0",
    up: "#3fb950",
    down: "#f85149",
    activity: "#3fb950",
    rain: "#58a6ff",
  },
} as const;

/* An SVG loaded through <img> cannot fetch a webfont, so these must be families
   the viewer already has. Metrics differ per OS, which is why every line is a
   single <text> of flowing <tspan>s: the browser lays them out, nothing here
   estimates a character width that could be wrong on someone else's machine. */
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const PAD_Y = 4;
const GUTTER = 36;
const TITLE_SIZE = 15;
const LINE_SIZE = 13;
const CAPTION_SIZE = 10.5;
const LINE_STEP = 21;
const TITLE_GAP = 27;
const CHART_HEIGHT = 34;
const CHART_GAP = 12;
const KICKER_GAP = 20;
const CAPTION_GAP = 16;

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type RunProps = { run: Run; theme: Theme };

const tspan = ({ run, theme }: RunProps) => {
  const colours = PALETTE[theme];
  if (run.kind === "label") {
    return `<tspan fill="${colours.label}">${escape(run.text)}</tspan>`;
  }
  const fill =
    run.kind === "up"
      ? colours.up
      : run.kind === "down"
        ? colours.down
        : colours.figure;
  return `<tspan font-family="${MONO}" font-size="${LINE_SIZE - 0.5}" font-weight="600" fill="${fill}">${escape(run.text)}</tspan>`;
};

type ChartProps = {
  chart: NonNullable<Cell["chart"]>;
  x: number;
  y: number;
  width: number;
  theme: Theme;
};

/* Drawn as real bars rather than unicode blocks: inside an SVG there is no
   reason to approximate a chart with text, and the block glyphs rendered at
   whatever size the font chose. */
const renderChart = ({ chart, x, y, width, theme }: ChartProps) => {
  const colours = PALETTE[theme];
  const buckets = Math.min(chart.values.length, 52);
  const size = Math.ceil(chart.values.length / buckets);
  const totals: number[] = [];
  for (let index = 0; index < chart.values.length; index += size) {
    totals.push(
      chart.values.slice(index, index + size).reduce((sum, v) => sum + v, 0),
    );
  }
  const peak = Math.max(...totals, 1);
  const step = width / totals.length;
  const barWidth = Math.max(1.5, step - 1.5);

  return totals
    .map((total, index) => {
      const height = Math.max(1.5, (total / peak) * CHART_HEIGHT);
      return `<rect x="${(x + index * step).toFixed(1)}" y="${(y + CHART_HEIGHT - height).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}" fill="${colours[chart.tone]}" rx="1"/>`;
    })
    .join("");
};

const contentHeight = (cell: Cell) =>
  TITLE_GAP +
  cell.lines.length * LINE_STEP +
  (cell.chart === undefined ? 0 : CHART_HEIGHT + CHART_GAP * 2) +
  (cell.kicker === undefined ? 0 : KICKER_GAP) +
  CAPTION_GAP +
  CAPTION_SIZE;

type CellProps = {
  cell: Cell;
  x: number;
  y: number;
  width: number;
  height: number;
  theme: Theme;
};

const renderCell = ({ cell, x, y, width, height, theme }: CellProps) => {
  const colours = PALETTE[theme];
  const parts: string[] = [];

  parts.push(
    `<text x="${x}" y="${y + 12}" font-family="${SANS}" font-size="${TITLE_SIZE}" font-weight="600" fill="${colours.figure}">${escape(`${cell.emoji}  ${cell.title}`)}</text>`,
  );

  let cursor = y + TITLE_GAP + 12;
  for (const line of cell.lines) {
    parts.push(
      `<text x="${x}" y="${cursor}" font-family="${SANS}" font-size="${LINE_SIZE}" fill="${colours.label}">${line.map((run) => tspan({ run, theme })).join("")}</text>`,
    );
    cursor += LINE_STEP;
  }

  if (cell.chart !== undefined) {
    const top = cursor - LINE_SIZE + CHART_GAP;
    parts.push(renderChart({ chart: cell.chart, x, y: top, width, theme }));
    /* Advance past the bars AND back down to a baseline, or the kicker draws
       straight through the chart. */
    cursor = top + CHART_HEIGHT + CHART_GAP + LINE_SIZE;
  }

  if (cell.kicker !== undefined) {
    parts.push(
      `<text x="${x}" y="${cursor + 4}" font-family="${SANS}" font-size="${LINE_SIZE - 0.5}" font-style="italic" fill="${colours.dim}">${escape(cell.kicker)}</text>`,
    );
  }

  /* Pinned to the bottom of the row rather than trailing the content, so the
     window labels line up across cells instead of floating at five heights. */
  parts.push(
    `<text x="${x}" y="${y + height}" font-family="${SANS}" font-size="${CAPTION_SIZE}" fill="${colours.dim}">${escape(cell.caption)}</text>`,
  );
  return parts.join("\n  ");
};

type GridProps = {
  cells: Cell[];
  columns: number;
  width: number;
  theme: Theme;
};

export const gridSvg = ({ cells, columns, width, theme }: GridProps) => {
  /* No outer horizontal padding: the card's first column starts flush with the
     surrounding markdown text and the last ends flush with the column edge, so
     the page reads as one grid rather than an inset box. */
  const columnWidth = (width - GUTTER * (columns - 1)) / columns;
  const cellHeight = Math.max(...cells.map(contentHeight));

  const body: string[] = [];
  let y = PAD_Y;
  for (let index = 0; index < cells.length; index += columns) {
    cells.slice(index, index + columns).forEach((cell, columnIndex) => {
      body.push(
        renderCell({
          cell,
          x: columnIndex * (columnWidth + GUTTER),
          y,
          width: columnWidth,
          height: cellHeight,
          theme,
        }),
      );
    });
    y += cellHeight + 30;
  }

  const height = Math.round(y - 30 + PAD_Y);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  ${body.join("\n  ")}
</svg>
`;
};
