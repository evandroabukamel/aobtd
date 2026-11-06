import type { ReactNode } from 'react';

interface Props {
  header: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  mapBusy: boolean;
}

/** Esqueleto da tela: cabeçalho, mapa à esquerda e barra lateral à direita. */
export function DashboardTemplate({ header, map, sidebar, mapBusy }: Props) {
  return (
    <div className="layout">
      {header}
      <main className="map-area" aria-busy={mapBusy}>
        {map}
      </main>
      <aside className="sidebar">{sidebar}</aside>
    </div>
  );
}
