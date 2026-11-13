import { hasKnownFatalities } from '../../../domain/accident';
import type { Formatters } from '../../../i18n/format';
import type { Messages } from '../../../i18n/messages';

/** Canvas colours: Leaflet draws markers on a canvas, so they cannot read CSS variables. */
export const MARKER_COLORS = { stroke: '#7a1d12', selected: '#111', fatal: '#d33a22', nonFatal: '#f08a24' } as const;

/** Size and colours of one accident's circle; unknown fatalities (-1) draw like none. */
export function markerStyle(fatalities: number, isSelected: boolean) {
  const fatal = fatalities > 0;
  return {
    radius: fatal ? Math.min(6 + Math.sqrt(fatalities) * 2, 18) : 6,
    pathOptions: {
      color: isSelected ? MARKER_COLORS.selected : MARKER_COLORS.stroke,
      weight: isSelected ? 3 : 1,
      fillColor: fatal ? MARKER_COLORS.fatal : MARKER_COLORS.nonFatal,
      fillOpacity: 0.8,
    },
  };
}

/** Hover text: "Mar 2, 2026 · 3 fatalities". */
export const markerLabel = (t: Messages, fmt: Formatters, fatalities: number, time: number) =>
  `${fmt.date(time)} · ${hasKnownFatalities(fatalities) ? t.fatalitiesTooltip(fatalities) : t.fatalitiesUnknown}`;
