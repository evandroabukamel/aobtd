import { ToggleButton } from '../atoms/ToggleButton';

interface Props {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function StatCard({ value, label, active, onClick }: Props) {
  return (
    <ToggleButton className="card" active={active} onClick={onClick}>
      <span className="card-value">{value}</span>
      <span className="card-label">{label}</span>
    </ToggleButton>
  );
}
