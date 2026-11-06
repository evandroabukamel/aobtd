import type { MarkerTuple } from '@aobtd/core';
import 'leaflet/dist/leaflet.css';
import { memo, useMemo } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { formatDate } from './format';

interface Props {
  markers: MarkerTuple[];
  selected: number | null;
  onSelect: (id: number) => void;
}

const radius = (fatalities: number) => (fatalities > 0 ? Math.min(6 + Math.sqrt(fatalities) * 2, 18) : 6);

/**
 * Renderização em canvas (preferCanvas): milhares de CircleMarkers sem criar um nó DOM
 * por marcador, o que mantém o mapa fluido mesmo no filtro de um ano inteiro.
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
            color: id === selected ? '#111' : '#7a1d12',
            weight: id === selected ? 3 : 1,
            fillColor: fatalities > 0 ? '#d33a22' : '#f08a24',
            fillOpacity: 0.8,
          }}
          eventHandlers={{ click: () => onSelect(id) }}
        >
          <Tooltip>
            {formatDate(t)} · {fatalities < 0 ? 'vítimas não informadas' : `${fatalities} vítima(s) fatal(is)`}
          </Tooltip>
        </CircleMarker>
      )),
    [markers, selected, onSelect],
  );

  return (
    <MapContainer center={[10, 0]} zoom={2} minZoom={2} worldCopyJump preferCanvas className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {layers}
    </MapContainer>
  );
}

export default memo(CrashMap);
