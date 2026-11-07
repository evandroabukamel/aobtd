import type { ReactNode } from 'react';

interface Props {
  href: string;
  className?: string;
  title?: string;
  children: ReactNode;
}

/** Link that opens in a new tab without giving the target page access to this one. */
export function ExternalLink({ href, className, title, children }: Props) {
  return (
    <a href={href} className={className} title={title} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
