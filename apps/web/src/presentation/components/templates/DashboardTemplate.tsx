import type { ReactNode } from 'react';

interface Props {
  header: ReactNode;
  /** Full-height menu on the left of the page. */
  nav: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  mapBusy: boolean;
}

/** Screen skeleton: full-height menu on the left, then header over the map, and the counters sidebar on the right. */
export function DashboardTemplate({ header, nav, map, sidebar, mapBusy }: Props) {
  return (
    <div className="layout">
      <aside className="nav-area">{nav}</aside>
      {header}
      <main className="map-area" aria-busy={mapBusy}>
        {map}
      </main>
      <aside className="sidebar">{sidebar}</aside>
    </div>
  );
}
