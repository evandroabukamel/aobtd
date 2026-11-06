import { createContext, useContext, type ReactNode } from 'react';
import type { AccidentRepository } from './ports/AccidentRepository';

const Ctx = createContext<AccidentRepository | null>(null);

/** Injeta a implementação do repositório (inversão de dependência). */
export function AccidentRepositoryProvider({ repository, children }: { repository: AccidentRepository; children: ReactNode }) {
  return <Ctx.Provider value={repository}>{children}</Ctx.Provider>;
}

export function useAccidentRepository(): AccidentRepository {
  const repo = useContext(Ctx);
  if (!repo) throw new Error('AccidentRepositoryProvider ausente');
  return repo;
}
