import type { StatsResponse } from '@aobtd/core';
import { memo } from 'react';
import type { Filter } from './api';
import { MONTHS, MONTHS_LONG } from './format';

interface Props {
  stats: StatsResponse | undefined;
  filter: Filter;
  year: number;
  now: Date;
  onFilter: (f: Filter) => void;
  onYear: (y: number) => void;
}

const isActive = (f: Filter, kind: Filter['kind'], year?: number, month?: number) =>
  f.kind === kind && (f.kind === '24h' || (f.year === year && f.month === month));

export const Counters = memo(function Counters({ stats, filter, year, now, onFilter, onYear }: Props) {
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth() + 1;
  const max = Math.max(1, ...(stats?.months ?? [0]));
  const v = (n: number | undefined) => (n === undefined ? '–' : n.toLocaleString('pt-BR'));

  return (
    <section className="counters" aria-label="Contadores">
      <div className="cards">
        <button className={`card ${isActive(filter, '24h') ? 'active' : ''}`} onClick={() => onFilter({ kind: '24h' })}>
          <span className="card-value">{v(stats?.last24h)}</span>
          <span className="card-label">últimas 24 horas</span>
        </button>
        <button
          className={`card ${isActive(filter, 'period', curYear, curMonth) ? 'active' : ''}`}
          onClick={() => onFilter({ kind: 'period', year: curYear, month: curMonth })}
        >
          <span className="card-value">{v(stats?.currentMonth)}</span>
          <span className="card-label">em {MONTHS_LONG[curMonth - 1]}</span>
        </button>
      </div>

      <div className="year-row">
        <label htmlFor="year">Ano</label>
        <select id="year" value={year} onChange={(e) => onYear(Number(e.target.value))}>
          {(stats?.years ?? [curYear]).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          className={`chip ${isActive(filter, 'period', year, undefined) ? 'active' : ''}`}
          onClick={() => onFilter({ kind: 'period', year })}
        >
          Ano inteiro: <strong>{v(stats?.yearTotal)}</strong>
        </button>
      </div>

      <ol className="months" aria-label={`Acidentes por mês em ${year}`}>
        {MONTHS.map((label, i) => {
          const count = stats?.months[i] ?? 0;
          const future = year === curYear && i + 1 > curMonth;
          return (
            <li key={label}>
              <button
                disabled={future}
                className={isActive(filter, 'period', year, i + 1) ? 'active' : ''}
                onClick={() => onFilter({ kind: 'period', year, month: i + 1 })}
                aria-label={`${MONTHS_LONG[i]}: ${count} acidentes`}
              >
                <span className="m-label">{label}</span>
                <span className="m-bar"><span style={{ width: `${(count / max) * 100}%` }} /></span>
                <span className="m-count">{future ? '' : count}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
});
