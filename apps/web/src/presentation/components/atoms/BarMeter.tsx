/** Proportional horizontal bar; `ratio` goes from 0 to 1. */
export function BarMeter({ ratio }: { ratio: number }) {
  return (
    <span className="m-bar">
      <span style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}
