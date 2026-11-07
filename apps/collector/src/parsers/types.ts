/** Raw item extracted from a source, before filtering and geocoding. */
export interface RawItem {
  url: string;
  title: string;
  summary?: string;
  publishedAt?: Date;
  /** Fields already structured by the source (e.g. Aviation Safety Network). */
  occurredAt?: Date;
  location?: string;
  aircraft?: string;
  fatalities?: number;
  /** true when the source is already an accident database: skips the keyword filter. */
  structured?: boolean;
}
