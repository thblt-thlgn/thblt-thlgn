export type Run = { text: string; kind: "text" | "figure" | "dim" };
export type Cell = {
  emoji: string;
  title: string;
  lines: Run[][];
  kicker?: string;
  caption: string;
};

export type Theme = "light" | "dark";

/* GitHub's own text colours, so the card sits on the page rather than on top of
   it. The background stays transparent — the page supplies it, which is also why
   nothing here may depend on a background colour. */
const PALETTE = {
  light: {
    text: "#1f2328",
    figure: "#0969da",
    dim: "#59636e",
    rule: "#d1d9e0",
  },
  dark: { text: "#e6edf3", figure: "#4493f8", dim: "#9198a1", rule: "#3d444d" },
} as const;

/* An SVG loaded through <img> cannot fetch a webfont, so these must be families
   the viewer already has. Metrics differ per OS, which is why every line is a
   single <text> with flowing <tspan>s: the browser lays them out, nothing here
   estimates a character width that could be wrong on someone else's machine. */
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const PAD = 20;
const GUTTER = 34;
const TITLE_SIZE = 15;
const LINE_SIZE = 13;
const CAPTION_SIZE = 10.5;
const LINE_STEP = 20;
const TITLE_GAP = 26;
const KICKER_GAP = 18;

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type RunProps = { run: Run; theme: Theme };

const tspan = ({ run, theme }: RunProps) => {
  const colours = PALETTE[theme];
  if (run.kind === "figure") {
    return `<tspan font-family="${MONO}" font-size="${LINE_SIZE - 0.5}" fill="${colours.figure}">${escape(run.text)}</tspan>`;
  }
  if (run.kind === "dim") {
    return `<tspan fill="${colours.dim}">${escape(run.text)}</tspan>`;
  }
  return `<tspan>${escape(run.text)}</tspan>`;
};

type CellProps = { cell: Cell; x: number; y: number; theme: Theme };

/* Returns the height it actually consumed rather than letting a separate
   estimate predict it. The two drifted by 4-8px per cell, which was enough for a
   four-line cell's caption to collide with the rule under its row. */
const renderCell = ({ cell, x, y, theme }: CellProps) => {
  const colours = PALETTE[theme];
  const parts: string[] = [];

  parts.push(
    `<text x="${x}" y="${y + 12}" font-family="${SANS}" font-size="${TITLE_SIZE}" font-weight="600" fill="${colours.text}">${escape(`${cell.emoji}  ${cell.title}`)}</text>`,
  );

  let cursor = y + TITLE_GAP + 12;
  for (const line of cell.lines) {
    parts.push(
      `<text x="${x}" y="${cursor}" font-family="${SANS}" font-size="${LINE_SIZE}" fill="${colours.text}">${line.map((run) => tspan({ run, theme })).join("")}</text>`,
    );
    cursor += LINE_STEP;
  }

  if (cell.kicker !== undefined) {
    cursor += KICKER_GAP - LINE_STEP + 6;
    parts.push(
      `<text x="${x}" y="${cursor}" font-family="${SANS}" font-size="${LINE_SIZE - 0.5}" font-style="italic" fill="${colours.dim}">${escape(cell.kicker)}</text>`,
    );
    cursor += LINE_STEP;
  }

  parts.push(
    `<text x="${x}" y="${cursor + 4}" font-family="${SANS}" font-size="${CAPTION_SIZE}" fill="${colours.dim}">${escape(cell.caption)}</text>`,
  );
  return { svg: parts.join("\n  "), height: cursor + 4 + CAPTION_SIZE - y };
};

type GridProps = {
  cells: Cell[];
  columns: number;
  width: number;
  theme: Theme;
};

export const gridSvg = ({ cells, columns, width, theme }: GridProps) => {
  const colours = PALETTE[theme];
  const columnWidth = (width - PAD * 2 - GUTTER * (columns - 1)) / columns;

  const rows: Cell[][] = [];
  for (let index = 0; index < cells.length; index += columns) {
    rows.push(cells.slice(index, index + columns));
  }

  const body: string[] = [];
  let y = PAD;
  rows.forEach((row, rowIndex) => {
    const rendered = row.map((cell, columnIndex) =>
      renderCell({
        cell,
        x: PAD + columnIndex * (columnWidth + GUTTER),
        y,
        theme,
      }),
    );
    body.push(...rendered.map((cell) => cell.svg));
    y += Math.max(...rendered.map((cell) => cell.height));
    if (rowIndex < rows.length - 1) {
      body.push(
        `<line x1="${PAD}" y1="${y + 6}" x2="${width - PAD}" y2="${y + 6}" stroke="${colours.rule}" stroke-width="1"/>`,
      );
      y += 26;
    }
  });

  const height = Math.round(y + PAD);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  ${body.join("\n  ")}
</svg>
`;
};
