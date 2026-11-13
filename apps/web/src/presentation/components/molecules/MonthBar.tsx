import { BarMeter } from '../atoms/BarMeter';
import { Toggle } from '../ui/toggle';

interface Props {
  label: string;
  ariaLabel: string;
  count: number;
  ratio: number;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}

/** One month of the histogram; future months are disabled and show no number. */
export function MonthBar({ label, ariaLabel, count, ratio, disabled, active, onClick }: Props) {
  return (
    <Toggle
      variant="filter"
      size="sm"
      pressed={active}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid h-7 w-full grid-cols-[2.25rem_1fr_2.25rem] gap-2 px-2 font-normal disabled:opacity-40"
    >
      <span className="text-left text-muted-foreground">{label}</span>
      <BarMeter ratio={ratio} />
      <span className="text-right tabular-nums">{disabled ? '' : count}</span>
    </Toggle>
  );
}
