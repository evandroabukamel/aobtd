import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    // A coleta roda a cada 6h: 5 minutos de cache no cliente evitam requisições à toa.
    queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
