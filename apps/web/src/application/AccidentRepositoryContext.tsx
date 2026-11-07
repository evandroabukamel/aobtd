import { createContext, useContext, type ReactNode } from 'react';
import type { AccidentRepository } from './ports/AccidentRepository';

const Ctx = createContext<AccidentRepository | null>(null);

/** Injects the repository implementation (dependency inversion). */
export function AccidentRepositoryProvider({ repository, children }: { repository: AccidentRepository; children: ReactNode }) {
  return <Ctx.Provider value={repository}>{children}</Ctx.Provider>;
}

export function useAccidentRepository(): AccidentRepository {
  const repo = useContext(Ctx);
  if (!repo) throw new Error('AccidentRepositoryProvider is missing');
  return repo;
}
