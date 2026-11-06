/** Item bruto extraído de uma fonte, antes da filtragem e geocodificação. */
export interface RawItem {
  url: string;
  title: string;
  summary?: string;
  publishedAt?: Date;
  /** Campos já estruturados pela fonte (ex.: Aviation Safety Network). */
  occurredAt?: Date;
  location?: string;
  aircraft?: string;
  fatalities?: number;
  /** true quando a fonte já é uma base de acidentes: dispensa o filtro de palavras-chave. */
  structured?: boolean;
}
