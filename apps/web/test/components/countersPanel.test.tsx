// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AccidentStats } from '../../src/domain/accident';
import { Filters, type Filter } from '../../src/domain/filter';
import { CountersPanel } from '../../src/presentation/components/organisms/CountersPanel';
import { renderWithI18n } from './renderWithI18n';

const now = new Date('2026-03-15T12:00:00Z');
const stats: AccidentStats = {
  year: 2026,
  last24h: 3,
  currentMonth: 12,
  yearTotal: 1234,
  months: [5, 7, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  years: [2026, 2025],
};

/** `statsOverride: undefined` stands for stats still loading, so it is checked by key, not by default value. */
function setup(filter: Filter = Filters.last24h(), opts: { statsOverride?: AccidentStats | undefined } = {}) {
  const statsOverride = 'statsOverride' in opts ? opts.statsOverride : stats;
  const onFilter = vi.fn();
  const onYear = vi.fn();
  const view = renderWithI18n(
    <CountersPanel stats={statsOverride} filter={filter} year={2026} now={now} onFilter={onFilter} onYear={onYear} />,
  );
  return { ...view, onFilter, onYear };
}

describe('CountersPanel', () => {
  it('shows the last-24h count and filters by it when clicked', async () => {
    const { user, onFilter } = setup(Filters.year(2026));
    const card = screen.getByRole('button', { name: /last 24 hours/i });
    expect(card).toHaveTextContent('3');
    expect(card).toHaveAttribute('aria-pressed', 'false');
    await user.click(card);
    expect(onFilter).toHaveBeenCalledWith(Filters.last24h());
  });

  it('marks the card that matches the current filter as pressed', () => {
    setup(Filters.month(2026, 3));
    expect(screen.getByRole('button', { name: /in March/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /last 24 hours/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('filters by the current month from its card', async () => {
    const { user, onFilter } = setup();
    const card = screen.getByRole('button', { name: /in March/i });
    expect(card).toHaveTextContent('12');
    await user.click(card);
    expect(onFilter).toHaveBeenCalledWith(Filters.month(2026, 3));
  });

  it('filters by the whole year and shows its total', async () => {
    const { user, onFilter } = setup();
    const chip = screen.getByRole('button', { name: /whole year/i });
    expect(chip).toHaveTextContent('1,234');
    await user.click(chip);
    expect(onFilter).toHaveBeenCalledWith(Filters.year(2026));
  });

  it('lists every month, disables the future ones and filters by a past one', async () => {
    const { user, onFilter } = setup();
    const months = within(screen.getByRole('list', { name: /2026/ })).getAllByRole('button');
    expect(months).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'February: 7' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'April: 0' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'February: 7' }));
    expect(onFilter).toHaveBeenCalledWith(Filters.month(2026, 2));
  });

  it('shows a dash while the stats are loading', () => {
    setup(Filters.last24h(), { statsOverride: undefined });
    expect(screen.getByRole('button', { name: /last 24 hours/i })).toHaveTextContent('–');
  });

  it('switches the year from the year picker', async () => {
    const { user, onYear } = setup();
    await user.selectOptions(screen.getByLabelText('Year'), '2025');
    expect(onYear).toHaveBeenCalledWith(2025);
  });
});
