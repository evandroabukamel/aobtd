// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AccidentDetail } from '../../src/domain/accident';
import { AccidentPanel } from '../../src/presentation/components/organisms/AccidentPanel';
import { renderWithI18n } from './renderWithI18n';

const accident: AccidentDetail = {
  id: 7,
  occurredAt: '2026-03-02T10:00:00Z',
  location: 'Madagascar',
  country: 'MG',
  aircraft: 'Cessna 208',
  fatalities: null,
  articles: [
    { title: 'Plane down near Antananarivo', url: 'https://news.example/a', source: 'Reuters', sourceKind: 'agency', publishedAt: '2026-03-03T08:00:00Z' },
    { title: 'Preliminary report', url: 'https://gov.example/r', source: 'BEA', sourceKind: 'government', publishedAt: null },
  ],
};

const setup = (props: Partial<Parameters<typeof AccidentPanel>[0]> = {}) => {
  const onClose = vi.fn();
  const view = renderWithI18n(<AccidentPanel accident={accident} isLoading={false} isError={false} onClose={onClose} {...props} />);
  return { ...view, onClose };
};

describe('AccidentPanel', () => {
  it('shows the accident facts, with a fallback for unknown values', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Madagascar' })).toBeInTheDocument();
    expect(screen.getByText('Cessna 208')).toBeInTheDocument();
    expect(screen.getByText('Mar 2, 2026')).toBeInTheDocument();
    expect(screen.getByText('Fatalities').nextSibling).toHaveTextContent(/not reported/i);
  });

  it('lists the sources as links opening in a new tab, labelled by kind', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Sources (2)' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Plane down near Antananarivo' });
    expect(link).toHaveAttribute('href', 'https://news.example/a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByText('News agency')).toBeInTheDocument();
    expect(screen.getByText('Official body')).toBeInTheDocument();
    expect(screen.getByText('Reuters', { exact: false })).toHaveTextContent('Reuters · Mar 3, 2026');
    expect(screen.getByText('BEA', { exact: false }).textContent).not.toContain('·');
  });

  it('closes from the close button', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the loading and error states before the details arrive', () => {
    setup({ accident: undefined, isLoading: true });
    expect(screen.getByRole('heading', { name: 'Accident' })).toBeInTheDocument();
    expect(screen.getByText(/loading sources/i)).toBeInTheDocument();
  });

  it('tells the user when the sources failed to load', () => {
    setup({ accident: undefined, isError: true });
    expect(screen.getByText(/could not load the sources/i)).toBeInTheDocument();
  });
});
