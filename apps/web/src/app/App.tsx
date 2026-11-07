import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AccidentRepositoryProvider } from '../application/AccidentRepositoryContext';
import { I18nProvider } from '../i18n/I18nContext';
import { createHttpAccidentRepository } from '../infrastructure/http/HttpAccidentRepository';
import { DashboardPage } from '../presentation/pages/DashboardPage';
import { createQueryClient } from './queryClient';

/** Composition root: the only place that picks the concrete implementations. */
export function App() {
  const [queryClient] = useState(createQueryClient);
  const [repository] = useState(() => createHttpAccidentRepository());

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AccidentRepositoryProvider repository={repository}>
          <DashboardPage />
        </AccidentRepositoryProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
