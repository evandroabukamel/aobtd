import { memo } from 'react';
import type { AccidentStats } from '../../../domain/accident';
import { currentYearMonth, isFutureMonth } from '../../../domain/calendar';
import { Filters, isSameFilter, type Filter } from '../../../domain/filter';
import { useI18n } from '../../../i18n/I18nContext';
import { ToggleButton } from '../atoms/ToggleButton';
import { MonthBar } from '../molecules/MonthBar';
import { StatCard } from '../molecules/StatCard';
import { YearSelect } from '../molecules/YearSelect';

interface Props {
  stats: AccidentStats | undefined;
  filter: Filter;
  year: number;
  now: Date;
  onFilter: (f: Filter) => void;
  onYear: (y: number) => void;
}

/** Counters next to the map: each one also works as a filter. */
export const CountersPanel = memo(function CountersPanel({ stats, filter, year, now, onFilter, onYear }: Props) {
  const { t, fmt } = useI18n();
  const cur = currentYearMonth(now);
  const max = Math.max(1, ...(stats?.months ?? [0]));
  const currentMonth = Filters.month(cur.year, cur.month);
  const wholeYear = Filters.year(year);

  return (
    <section className="counters" aria-label={t.counters}>
      <div className="cards">
        <StatCard
          value={fmt.count(stats?.last24h)}
          label={t.last24h}
          active={isSameFilter(filter, Filters.last24h())}
          onClick={() => onFilter(Filters.last24h())}
        />
        <StatCard
          value={fmt.count(stats?.currentMonth)}
          label={t.inMonth(fmt.monthsLong[cur.month - 1]!)}
          active={isSameFilter(filter, currentMonth)}
          onClick={() => onFilter(currentMonth)}
        />
      </div>

      <div className="year-row">
        <YearSelect years={stats?.years ?? [cur.year]} value={year} onChange={onYear} label={t.year} />
        <ToggleButton className="chip" active={isSameFilter(filter, wholeYear)} onClick={() => onFilter(wholeYear)}>
          {t.wholeYear}: <strong>{fmt.count(stats?.yearTotal)}</strong>
        </ToggleButton>
      </div>

      <ol className="months" aria-label={t.accidentsPerMonth(year)}>
        {fmt.monthsShort.map((label, i) => {
          const month = i + 1;
          const count = stats?.months[i] ?? 0;
          const target = Filters.month(year, month);
          return (
            <li key={month}>
              <MonthBar
                label={label}
                ariaLabel={t.monthCount(fmt.monthsLong[i]!, count)}
                count={count}
                ratio={count / max}
                disabled={isFutureMonth(year, month, now)}
                active={isSameFilter(filter, target)}
                onClick={() => onFilter(target)}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
});
