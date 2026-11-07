import type { AccidentDetail, AccidentMarkers, AccidentStats, CollectionStatus } from '../../domain/accident';
import type { Filter } from '../../domain/filter';

/**
 * Outbound port: what the application needs to know about accidents, not where they come from.
 * The HTTP implementation lives in infrastructure; tests can use an in-memory one.
 */
export interface AccidentRepository {
  listMarkers(filter: Filter, signal?: AbortSignal): Promise<AccidentMarkers>;
  getStats(year: number, signal?: AbortSignal): Promise<AccidentStats>;
  getAccident(id: number, signal?: AbortSignal): Promise<AccidentDetail>;
  getStatus(signal?: AbortSignal): Promise<CollectionStatus>;
}
