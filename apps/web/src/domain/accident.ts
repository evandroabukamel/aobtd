/**
 * Entidades do domínio. Os contratos vêm do pacote compartilhado com a API,
 * então o frontend só os reexporta (somente tipos, nada vai para o bundle).
 */
export type {
  AccidentDetailResponse as AccidentDetail,
  ArticleDto as Article,
  MarkerTuple as AccidentMarker,
  MarkersResponse as AccidentMarkers,
  SourceKind,
  StatsResponse as AccidentStats,
} from '@aobtd/core';

/** No marcador, -1 significa número de vítimas desconhecido. */
export const hasKnownFatalities = (fatalities: number) => fatalities >= 0;
