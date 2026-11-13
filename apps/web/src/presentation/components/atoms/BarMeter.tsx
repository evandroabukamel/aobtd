/** Proportional horizontal bar; `ratio` goes from 0 to 1. Decorative: the count next to it is the data. */
export function BarMeter({ ratio }: { ratio: number }) {
  return (
    <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-muted">
      <span className="block h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}
