import 'leaflet/dist/leaflet.css';
import { memo, useMemo } from 'react';
import { AttributionControl, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { hasKnownFatalities, type AccidentMarker } from '../../../domain/accident';
import { formatDate } from '../../shared/format';

interface Props {
  markers: AccidentMarker[];
  selected: number | null;
  onSelect: (id: number) => void;
}

const COLORS = { stroke: '#7a1d12', selected: '#111', fatal: '#d33a22', nonFatal: '#f08a24' } as const;

const radius = (fatalities: number) => (fatalities > 0 ? Math.min(6 + Math.sqrt(fatalities) * 2, 18) : 6);

const tooltipText = (fatalities: number, occurredAt: number) =>
  `${formatDate(occurredAt)} · ${hasKnownFatalities(fatalities) ? `${fatalities} vítima(s) fatal(is)` : 'vítimas não informadas'}`;

/**
 * Renderização em canvas (preferCanvas): milhares de CircleMarkers sem criar um nó DOM
 * por marcador, o que mantém o mapa fluido mesmo no filtro de um ano inteiro.
 * Exportado como default para ser carregado com React.lazy (Leaflet num chunk separado).
 */
function CrashMap({ markers, selected, onSelect }: Props) {
  const layers = useMemo(
    () =>
      markers.map(([id, lat, lng, fatalities, t]) => (
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
          <Tooltip>{tooltipText(fatalities, t)}</Tooltip>
        </CircleMarker>
      )),
    [markers, selected, onSelect],
  );

  return (
    <MapContainer center={[10, 0]} zoom={2} minZoom={2} worldCopyJump preferCanvas attributionControl={false} className="map">
      {/* prefix vazio remove o "Leaflet" antes da atribuição do OpenStreetMap. */}
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
