import type { ReactNode } from 'react';
import { cx } from '../../shared/cx';

export function Badge({ variant, children }: { variant: string; children: ReactNode }) {
  return <span className={cx('badge', variant)}>{children}</span>;
}
