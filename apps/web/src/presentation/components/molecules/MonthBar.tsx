import { BarMeter } from '../atoms/BarMeter';
import { ToggleButton } from '../atoms/ToggleButton';

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
    <ToggleButton active={active} disabled={disabled} onClick={onClick} aria-label={ariaLabel}>
      <span className="m-label">{label}</span>
      <BarMeter ratio={ratio} />
      <span className="m-count">{disabled ? '' : count}</span>
    </ToggleButton>
  );
}
