import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AccidentRepositoryProvider } from '../application/AccidentRepositoryContext';
import { createHttpAccidentRepository } from '../infrastructure/http/HttpAccidentRepository';
import { DashboardPage } from '../presentation/pages/DashboardPage';
import { createQueryClient } from './queryClient';

/** Raiz de composição: é o único lugar que escolhe as implementações concretas. */
export function App() {
  const [queryClient] = useState(createQueryClient);
  const [repository] = useState(() => createHttpAccidentRepository());

  return (
    <QueryClientProvider client={queryClient}>
      <AccidentRepositoryProvider repository={repository}>
        <DashboardPage />
      </AccidentRepositoryProvider>
    </QueryClientProvider>
  );
}
