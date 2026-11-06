import type { AccidentDetail, AccidentMarkers, AccidentStats } from '../../domain/accident';
import type { Filter } from '../../domain/filter';

/**
 * Porta de saída: o que a aplicação precisa saber dos acidentes, sem saber de onde vêm.
 * A implementação HTTP fica em infrastructure; testes podem usar uma em memória.
 */
export interface AccidentRepository {
  listMarkers(filter: Filter, signal?: AbortSignal): Promise<AccidentMarkers>;
  getStats(year: number, signal?: AbortSignal): Promise<AccidentStats>;
  getAccident(id: number, signal?: AbortSignal): Promise<AccidentDetail>;
}
