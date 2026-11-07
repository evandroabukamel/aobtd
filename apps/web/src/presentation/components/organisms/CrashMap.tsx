import 'leaflet/dist/leaflet.css';
import { memo, useMemo } from 'react';
import { AttributionControl, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { hasKnownFatalities, type AccidentMarker } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';

interface Props {
  markers: AccidentMarker[];
  selected: number | null;
  onSelect: (id: number) => void;
}

const COLORS = { stroke: '#7a1d12', selected: '#111', fatal: '#d33a22', nonFatal: '#f08a24' } as const;

const radius = (fatalities: number) => (fatalities > 0 ? Math.min(6 + Math.sqrt(fatalities) * 2, 18) : 6);

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
        <CircleMarker
          key={id}
          center={[lat, lng]}
          radius={radius(fatalities)}
          pathOptions={{
            className: 'crash-marker',
            color: id === selected ? COLORS.selected : COLORS.stroke,
            weight: id === selected ? 3 : 1,
            fillColor: fatalities > 0 ? COLORS.fatal : COLORS.nonFatal,
            fillOpacity: 0.8,
          }}
          eventHandlers={{ click: () => onSelect(id) }}
        >
          <Tooltip>
            {`${fmt.date(time)} · ${hasKnownFatalities(fatalities) ? t.fatalitiesTooltip(fatalities) : t.fatalitiesUnknown}`}
          </Tooltip>
        </CircleMarker>
      )),
    [markers, selected, onSelect, t, fmt],
  );

  return (
    <MapContainer center={[10, 0]} zoom={2} minZoom={2} worldCopyJump preferCanvas attributionControl={false} className="map">
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
