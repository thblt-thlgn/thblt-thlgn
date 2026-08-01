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
  accent: Accent;
  /* Set on the odd cell out so it takes the whole row instead of leaving a hole
     beside it. */
  span?: boolean;
};

export type Accent = "green" | "purple" | "amber" | "pink" | "blue";

export type Theme = "light" | "dark";

/* GitHub's own canvas and border tokens, so the panels read as part of the page
   rather than as a graphic pasted onto it.

   Figures are deliberately NOT the link blue: on a page whose only other accent
   is a hyperlink, a blue number reads as clickable. Emphasis comes from weight
   and from dimming what surrounds them. Green and red are kept for added and
   removed lines, where the colour carries the meaning. */
const PALETTE = {
  light: {
    panel: "#f6f8fa",
    border: "#d1d9e0",
    figure: "#1f2328",
    label: "#59636e",
    dim: "#818b98",
    up: "#1a7f37",
    down: "#cf222e",
    activity: "#40c463",
    rain: "#54aeff",
    green: "#2da44e",
    purple: "#8250df",
    amber: "#bf8700",
    pink: "#bf3989",
    blue: "#0969da",
  },
  dark: {
    panel: "#151b23",
    border: "#3d444d",
    figure: "#f0f6fc",
    label: "#b7bfc7",
    dim: "#9198a1",
    up: "#3fb950",
    down: "#f85149",
    activity: "#3fb950",
    rain: "#58a6ff",
    green: "#3fb950",
    purple: "#a371f7",
    amber: "#d29922",
    pink: "#db61a2",
    blue: "#58a6ff",
  },
} as const;

/* An SVG loaded through <img> cannot fetch a webfont, so these must be families
   the viewer already has. Metrics differ per OS, which is why every line is a
   single <text> of flowing <tspan>s: the browser lays them out, nothing here
   estimates a character width that could be wrong on someone else's machine. */
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const PANEL_RADIUS = 10;
const PANEL_PADDING = 18;
const GUTTER = 16;
const ROW_GAP = 16;
const TITLE_SIZE = 14.5;
const LINE_SIZE = 13;
const LINE_STEP = 21;
const TITLE_GAP = 26;
/* Kept short on purpose: at 34 the bars dwarfed the three lines of text above
   them, which is what made the right-hand column look unbalanced. */
const CHART_HEIGHT = 22;
const CHART_GAP = 12;
const KICKER_GAP = 20;

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

const renderChart = ({ chart, x, y, width, theme }: ChartProps) => {
  const colours = PALETTE[theme];
  const buckets = Math.min(chart.values.length, Math.floor(width / 6));
  const size = Math.ceil(chart.values.length / Math.max(buckets, 1));
  const totals: number[] = [];
  for (let index = 0; index < chart.values.length; index += size) {
    totals.push(
      chart.values.slice(index, index + size).reduce((sum, v) => sum + v, 0),
    );
  }
  const peak = Math.max(...totals, 1);
  const step = width / totals.length;
  const barWidth = Math.max(1.5, step - 2);

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
  PANEL_PADDING;

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
  const inner = x + PANEL_PADDING;
  const innerWidth = width - PANEL_PADDING * 2;
  const parts: string[] = [];

  /* The half-pixel offset keeps the 1px stroke on the pixel grid instead of
     straddling it, which is what makes a hairline border look grey and blurry. */
  parts.push(
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${height - 1}" rx="${PANEL_RADIUS}" fill="${colours.panel}" stroke="${colours.border}"/>`,
  );
  /* A wash rather than a fill: enough to give each panel its own temperature at
     a glance, far too faint to compete with the figures. */
  parts.push(
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${height - 1}" rx="${PANEL_RADIUS}" fill="url(#wash-${cell.accent})"/>`,
  );

  parts.push(
    `<text x="${inner}" y="${y + PANEL_PADDING + 12}" font-family="${SANS}" font-size="${TITLE_SIZE}" font-weight="600" fill="${colours.figure}">${escape(`${cell.emoji}  ${cell.title}`)}</text>`,
  );

  let cursor = y + PANEL_PADDING + TITLE_GAP + 12;
  for (const line of cell.lines) {
    parts.push(
      `<text x="${inner}" y="${cursor}" font-family="${SANS}" font-size="${LINE_SIZE}" fill="${colours.label}">${line.map((run) => tspan({ run, theme })).join("")}</text>`,
    );
    cursor += LINE_STEP;
  }

  if (cell.chart !== undefined) {
    const top = cursor - LINE_SIZE + CHART_GAP;
    parts.push(
      renderChart({
        chart: cell.chart,
        x: inner,
        y: top,
        width: innerWidth,
        theme,
      }),
    );
    cursor = top + CHART_HEIGHT + CHART_GAP + LINE_SIZE;
  }

  if (cell.kicker !== undefined) {
    parts.push(
      `<text x="${inner}" y="${cursor + 4}" font-family="${SANS}" font-size="${LINE_SIZE - 0.5}" font-style="italic" fill="${colours.dim}">${escape(cell.kicker)}</text>`,
    );
  }

  return parts.join("\n  ");
};

type GridProps = {
  cells: Cell[];
  columns: number;
  width: number;
  theme: Theme;
};

export const gridSvg = ({ cells, columns, width, theme }: GridProps) => {
  const colours = PALETTE[theme];
  const columnWidth = (width - GUTTER * (columns - 1)) / columns;
  const cellHeight = Math.max(...cells.map(contentHeight)) + PANEL_PADDING * 2;

  const body: string[] = [];
  let y = 0;
  let column = 0;
  for (const cell of cells) {
    const spans = cell.span === true && columns > 1;
    if (spans && column !== 0) {
      column = 0;
      y += cellHeight + ROW_GAP;
    }
    body.push(
      renderCell({
        cell,
        x: spans ? 0 : column * (columnWidth + GUTTER),
        y,
        width: spans ? width : columnWidth,
        height: cellHeight,
        theme,
      }),
    );
    column += spans ? columns : 1;
    if (column >= columns) {
      column = 0;
      y += cellHeight + ROW_GAP;
    }
  }

  const height = Math.round(column === 0 ? y - ROW_GAP : y + cellHeight);
  const washes = (["green", "purple", "amber", "pink", "blue"] as const)
    .map(
      (accent) =>
        `<linearGradient id="wash-${accent}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colours[accent]}" stop-opacity="0.10"/>
      <stop offset="60%" stop-color="${colours[accent]}" stop-opacity="0"/>
    </linearGradient>`,
    )
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    ${washes}
  </defs>
  ${body.join("\n  ")}
</svg>
`;
};
