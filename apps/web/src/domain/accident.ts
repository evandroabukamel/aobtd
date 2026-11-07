/**
 * Domain entities. The contracts come from the package shared with the API,
 * so the frontend only re-exports them (types only, nothing reaches the bundle).
 */
export type {
  AccidentDetailResponse as AccidentDetail,
  ArticleDto as Article,
  MarkerTuple as AccidentMarker,
  MarkersResponse as AccidentMarkers,
  SourceKind,
  StatsResponse as AccidentStats,
  StatusResponse as CollectionStatus,
} from '@aobtd/core';

/** In a marker, -1 means the number of fatalities is unknown. */
export const hasKnownFatalities = (fatalities: number) => fatalities >= 0;
