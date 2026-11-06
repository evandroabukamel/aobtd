import type { ReactNode } from 'react';

interface Props {
  tone: 'muted' | 'error';
  as?: 'p' | 'div';
  children: ReactNode;
}

export function StatusMessage({ tone, as: Tag = 'p', children }: Props) {
  return <Tag className={tone}>{children}</Tag>;
}
