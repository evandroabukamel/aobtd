import type { ReactNode } from 'react';

interface Props {
  header: ReactNode;
  /** Full-height menu on the left of the page. */
  nav: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  mapBusy: boolean;
}

/**
 * Screen skeleton: full-height menu on the left, then header over the map, and the counters sidebar on the right.
 * On phones everything stacks: header, map, counters, then the menu.
 */
export function DashboardTemplate({ header, nav, map, sidebar, mapBusy }: Props) {
  return (
    <div className="grid grid-cols-1 grid-rows-[auto_55vh_auto_auto] [grid-template-areas:'top'_'map'_'side'_'nav'] min-[801px]:h-full min-[801px]:grid-cols-[190px_1fr_300px] min-[801px]:grid-rows-[auto_1fr] min-[801px]:[grid-template-areas:'nav_top_top'_'nav_map_side'] min-[1101px]:grid-cols-[220px_1fr_340px]">
      <aside className="min-h-0 border-t bg-card [grid-area:nav] min-[801px]:overflow-y-auto min-[801px]:border-t-0 min-[801px]:border-r">{nav}</aside>
      {header}
      {/* `isolate` keeps Leaflet's pane z-indexes (up to 1000) inside the map, so menus and selects open above it. */}
      <main className="group relative isolate min-h-0 [grid-area:map]" aria-busy={mapBusy}>
        {map}
      </main>
      <aside className="flex flex-col gap-4 border-t bg-card p-4 [grid-area:side] min-[801px]:overflow-y-auto min-[801px]:border-t-0 min-[801px]:border-l">{sidebar}</aside>
    </div>
  );
}
