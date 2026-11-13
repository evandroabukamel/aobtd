// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccidentRepositoryProvider } from '../../src/application/AccidentRepositoryContext';
import type { AccidentRepository } from '../../src/application/ports/AccidentRepository';
import type { AccidentMarker } from '../../src/domain/accident';
import { DashboardPage } from '../../src/presentation/pages/DashboardPage';
import { renderWithI18n } from './renderWithI18n';

// Leaflet draws on a canvas jsdom cannot render: stand in a map whose markers are buttons.
vi.mock('../../src/presentation/components/organisms/CrashMap', () => ({
  default: ({ markers, onSelect }: { markers: AccidentMarker[]; onSelect: (id: number) => void }) => (
    <div>
      {markers.map(([id]) => (
        <button key={id} type="button" onClick={() => onSelect(id)}>
          marker {id}
        </button>
      ))}
    </div>
  ),
}));

const year = new Date().getUTCFullYear();

function fakeRepository(overrides: Partial<AccidentRepository> = {}): AccidentRepository {
  return {
    listMarkers: async (filter) =>
      filter.kind === '24h'
        ? { from: '', to: '', total: 1, markers: [[7, -18.9, 47.5, 3, 1_772_400_000]] }
        : { from: '', to: '', total: 5, markers: [[7, -18.9, 47.5, 3, 1_772_400_000], [8, 48.8, 2.3, 0, 1_772_400_000]] },
    getStats: async () => ({ year, last24h: 1, currentMonth: 5, yearTotal: 40, months: Array(12).fill(1), years: [year] }),
    getStatus: async () => ({ lastScanAt: null, sources: 3 }),
    getAccident: async (id) => ({
      id, occurredAt: '2026-03-02T10:00:00Z', location: 'Madagascar', country: 'MG', aircraft: null, fatalities: 3,
      articles: [{ title: 'Crash report', url: 'https://news.example/a', source: 'Reuters', sourceKind: 'agency', publishedAt: null }],
    }),
    ...overrides,
  };
}

function renderPage(repository = fakeRepository()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithI18n(
    <QueryClientProvider client={client}>
      <AccidentRepositoryProvider repository={repository}>
        <DashboardPage />
      </AccidentRepositoryProvider>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('opens on the current month and follows the filter chosen in the counters', async () => {
    const { user } = renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Aircraft crash monitor' })).toBeInTheDocument();
    expect(await screen.findByText('on the map: 5')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /last 24 hours/i }));
    expect(await screen.findByText('on the map: 1')).toBeInTheDocument();
  });

  it('shows the selected accident, names it in the error report, and closes it', async () => {
    const { user } = renderPage();
    const generic = within(screen.getByRole('navigation')).getByRole('link', { name: /report it/i });
    expect(new URL(generic.getAttribute('href')!).searchParams.get('title')).toBe('Wrong data on the map');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'marker 7' }));
    expect(await screen.findByRole('heading', { name: 'Madagascar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crash report' })).toBeInTheDocument();
    const report = within(screen.getByRole('navigation')).getByRole('link', { name: /report it/i });
    expect(new URL(report.getAttribute('href')!).searchParams.get('title')).toBe('Wrong data: accident #7 (Madagascar)');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('heading', { name: 'Madagascar' })).not.toBeInTheDocument();
  });

  it('tells the user when the accidents could not be loaded', async () => {
    renderPage(fakeRepository({ listMarkers: () => Promise.reject(new Error('down')) }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the accidents.');
    expect(screen.queryByRole('button', { name: /^marker/ })).not.toBeInTheDocument();
  });
});
