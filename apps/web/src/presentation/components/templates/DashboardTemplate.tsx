import type { ReactNode } from 'react';

interface Props {
  header: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  mapBusy: boolean;
}

/** Screen skeleton: header, map on the left and sidebar on the right. */
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
