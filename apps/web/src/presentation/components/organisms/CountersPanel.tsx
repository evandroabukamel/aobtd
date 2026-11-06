import { memo } from 'react';
import type { AccidentStats } from '../../../domain/accident';
import { currentYearMonth, isFutureMonth } from '../../../domain/calendar';
import { Filters, isSameFilter, type Filter } from '../../../domain/filter';
import { formatCount, MONTHS, MONTHS_LONG } from '../../shared/format';
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

/** Contadores ao lado do mapa: cada um também funciona como filtro. */
export const CountersPanel = memo(function CountersPanel({ stats, filter, year, now, onFilter, onYear }: Props) {
  const cur = currentYearMonth(now);
  const max = Math.max(1, ...(stats?.months ?? [0]));
  const currentMonth = Filters.month(cur.year, cur.month);
  const wholeYear = Filters.year(year);

  return (
    <section className="counters" aria-label="Contadores">
      <div className="cards">
        <StatCard
          value={formatCount(stats?.last24h)}
          label="últimas 24 horas"
          active={isSameFilter(filter, Filters.last24h())}
          onClick={() => onFilter(Filters.last24h())}
        />
        <StatCard
          value={formatCount(stats?.currentMonth)}
          label={`em ${MONTHS_LONG[cur.month - 1]}`}
          active={isSameFilter(filter, currentMonth)}
          onClick={() => onFilter(currentMonth)}
        />
      </div>

      <div className="year-row">
        <YearSelect years={stats?.years ?? [cur.year]} value={year} onChange={onYear} />
        <ToggleButton className="chip" active={isSameFilter(filter, wholeYear)} onClick={() => onFilter(wholeYear)}>
          Ano inteiro: <strong>{formatCount(stats?.yearTotal)}</strong>
        </ToggleButton>
      </div>

      <ol className="months" aria-label={`Acidentes por mês em ${year}`}>
        {MONTHS.map((label, i) => {
          const month = i + 1;
          const count = stats?.months[i] ?? 0;
          const target = Filters.month(year, month);
          return (
            <li key={label}>
              <MonthBar
                label={label}
                ariaLabel={`${MONTHS_LONG[i]}: ${count} acidentes`}
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
