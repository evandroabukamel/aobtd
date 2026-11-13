import NumberFlow from '@number-flow/react';
import { useI18n } from '../../../i18n/I18nContext';
import { Toggle } from '../ui/toggle';

interface Props {
  /** `undefined` while loading: shows a dash. */
  value: number | undefined;
  label: string;
  active: boolean;
  onClick: () => void;
}

/** Counter that is also a filter; the number animates when it changes (off with reduced motion). */
export function StatCard({ value, label, active, onClick }: Props) {
  const { locale } = useI18n();
  return (
    <Toggle
      variant="filter"
      pressed={active}
      onClick={onClick}
      className="h-auto flex-col items-start gap-0.5 border-border bg-background p-3 text-left whitespace-normal"
    >
      <span className="text-3xl font-bold tabular-nums">{value === undefined ? '–' : <NumberFlow value={value} locales={locale} />}</span>
      <span className="text-sm font-normal text-muted-foreground">{label}</span>
    </Toggle>
  );
}
