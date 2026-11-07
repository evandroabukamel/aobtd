import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../shared/cx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

/** Filter button: gets the `active` class when it stands for the current filter. */
export function ToggleButton({ active, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={cx(className, active && 'active')} aria-pressed={active} {...rest} />;
}
