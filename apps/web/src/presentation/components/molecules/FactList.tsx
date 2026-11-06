import type { ReactNode } from 'react';

export interface Fact {
  term: string;
  value: ReactNode;
}

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="facts">
      {facts.map((f) => (
        <div key={f.term}>
          <dt>{f.term}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
