import type { SourceKind } from '../../domain/accident';
import type { Filter } from '../../domain/filter';

export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });
/** Aceita ISO 8601 ou epoch em segundos (formato dos marcadores). */
export const formatDate = (iso: string | number) => dateFmt.format(typeof iso === 'number' ? iso * 1000 : new Date(iso));

/** Contagem com separador de milhar; '–' enquanto ainda não carregou. */
export const formatCount = (n: number | undefined) => (n === undefined ? '–' : n.toLocaleString('pt-BR'));

export const KIND_LABEL: Record<SourceKind, string> = {
  government: 'Órgão oficial',
  database: 'Base de dados',
  agency: 'Agência de notícias',
};

export function describeFilter(f: Filter): string {
  if (f.kind === '24h') return 'Últimas 24 horas';
  return f.month ? `${MONTHS_LONG[f.month - 1]} de ${f.year}` : `Ano de ${f.year}`;
}
