import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../shared/cx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

/** Botão de filtro: recebe a classe `active` quando representa o filtro atual. */
export function ToggleButton({ active, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={cx(className, active && 'active')} aria-pressed={active} {...rest} />;
}
