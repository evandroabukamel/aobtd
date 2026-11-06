/** Barra horizontal proporcional; `ratio` vai de 0 a 1. */
export function BarMeter({ ratio }: { ratio: number }) {
  return (
    <span className="m-bar">
      <span style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}
