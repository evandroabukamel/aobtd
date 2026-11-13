import 'leaflet/dist/leaflet.css';
import { memo, useMemo } from 'react';
import { AttributionControl, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import type { AccidentMarker } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { markerLabel, markerStyle } from './crashMarker';

interface Props {
  markers: AccidentMarker[];
  selected: number | null;
  onSelect: (id: number) => void;
}

/**
 * Canvas rendering (preferCanvas): thousands of CircleMarkers without one DOM node per
 * marker, which keeps the map smooth even with a whole-year filter.
 * Default export so it can be loaded with React.lazy (Leaflet in a separate chunk).
 */
function CrashMap({ markers, selected, onSelect }: Props) {
  const { t, fmt } = useI18n();
  const layers = useMemo(
    () =>
      markers.map(([id, lat, lng, fatalities, time]) => (
        <CircleMarker key={id} center={[lat, lng]} {...markerStyle(fatalities, id === selected)} eventHandlers={{ click: () => onSelect(id) }}>
          <Tooltip>{markerLabel(t, fmt, fatalities, time)}</Tooltip>
        </CircleMarker>
      )),
    [markers, selected, onSelect, t, fmt],
  );

  return (
    <MapContainer center={[10, 0]} zoom={2} minZoom={2} worldCopyJump preferCanvas attributionControl={false} className="size-full">
      {/* An empty prefix removes the "Leaflet" text before the OpenStreetMap attribution. */}
      <AttributionControl prefix="" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {layers}
    </MapContainer>
  );
}

export default memo(CrashMap);
