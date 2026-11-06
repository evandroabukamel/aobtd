export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });
export const formatDate = (iso: string | number) => dateFmt.format(typeof iso === 'number' ? iso * 1000 : new Date(iso));

export const KIND_LABEL = { government: 'Órgão oficial', database: 'Base de dados', agency: 'Agência de notícias' } as const;
