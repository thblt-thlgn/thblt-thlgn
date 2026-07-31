const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

type SparklineProps = { values: number[]; columns: number; source: string };

/* Buckets the series into fixed columns and scales to the tallest bucket. An
   all-zero series would render as a flat baseline that looks like real data, so
   it is treated as a failure and named. */
export const sparkline = ({ values, columns, source }: SparklineProps) => {
  if (values.length === 0) {
    throw new Error(`${source}: empty series, no sparkline to draw`);
  }
  const size = Math.ceil(values.length / columns);
  const buckets: number[] = [];
  for (let index = 0; index < values.length; index += size) {
    buckets.push(
      values.slice(index, index + size).reduce((sum, value) => sum + value, 0),
    );
  }

  const peak = Math.max(...buckets);
  if (peak <= 0) {
    throw new Error(
      `${source}: every bucket is zero, refusing to draw a flat line`,
    );
  }

  return buckets
    .map((bucket) => {
      const level = Math.ceil((bucket / peak) * BLOCKS.length);
      return BLOCKS[Math.min(BLOCKS.length - 1, Math.max(0, level - 1))];
    })
    .join("");
};
