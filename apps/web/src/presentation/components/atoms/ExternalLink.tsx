import type { ComponentProps } from 'react';

/**
 * Link that opens in a new tab without giving the target page access to this one.
 * Forwards every anchor prop, so it can sit under a shadcn `Button asChild`.
 */
export function ExternalLink(props: Omit<ComponentProps<'a'>, 'target' | 'rel'>) {
  return <a {...props} target="_blank" rel="noopener noreferrer" />;
}
