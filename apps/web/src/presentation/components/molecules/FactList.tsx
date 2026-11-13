import type { ReactNode } from 'react';
import { cn } from '../../shared/utils';

export interface Fact {
  term: string;
  value: ReactNode;
}

const LAYOUTS = {
  /** Term on the left, value on the right (accident panel). */
  inline: { row: 'flex justify-between gap-2', value: 'text-right' },
  /** Value under its term, emphasised (left menu). */
  stacked: { row: 'grid gap-px', value: 'font-semibold tabular-nums' },
} as const;

export function FactList({ facts, layout = 'inline' }: { facts: Fact[]; layout?: keyof typeof LAYOUTS }) {
  const styles = LAYOUTS[layout];
  return (
    <dl className="grid gap-2 text-sm">
      {facts.map((f) => (
        <div key={f.term} className={styles.row}>
          <dt className="text-muted-foreground">{f.term}</dt>
          <dd className={cn('m-0', styles.value)}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
