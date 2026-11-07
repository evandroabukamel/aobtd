import { lazy, Suspense, useMemo } from 'react';
import { useCollectionStatus } from '../../application/queries/useCollectionStatus';
import { useAccident } from '../../application/queries/useAccident';
import { useMarkers } from '../../application/queries/useMarkers';
import { useStats } from '../../application/queries/useStats';
import { useDashboardState } from '../../application/useDashboardState';
import { siteLinks } from '../../config/siteLinks';
import { useI18n } from '../../i18n/I18nContext';
import { StatusMessage } from '../components/atoms/StatusMessage';
import { MapCaption } from '../components/molecules/MapCaption';
import { AboutCard } from '../components/organisms/AboutCard';
import { AccidentPanel } from '../components/organisms/AccidentPanel';
import { AppHeader } from '../components/organisms/AppHeader';
import { CountersPanel } from '../components/organisms/CountersPanel';
import { DashboardTemplate } from '../components/templates/DashboardTemplate';

// Leaflet is only downloaded when the map mounts (separate chunk).
const CrashMap = lazy(() => import('../components/organisms/CrashMap'));

/** The site's only page: wires state and queries to the visual components. */
export function DashboardPage() {
  const { t, describeFilter } = useI18n();
  const { now, filter, year, selectedId, changeFilter, changeYear, selectAccident, clearSelection } = useDashboardState();
  const stats = useStats(year);
  const markers = useMarkers(filter);
  const accident = useAccident(selectedId);
  const status = useCollectionStatus();
  const reportTarget = useMemo(
    () => (selectedId === null ? null : { id: selectedId, location: accident.data?.location ?? null }),
    [selectedId, accident.data?.location],
  );

  return (
    <DashboardTemplate
      header={<AppHeader />}
      mapBusy={markers.isFetching}
      map={
        <>
          <MapCaption title={describeFilter(filter)} detail={markers.data ? t.onMap(markers.data.total) : t.loading} />
          <Suspense fallback={<div className="map-placeholder">{t.loadingMap}</div>}>
            <CrashMap markers={markers.data?.markers ?? []} selected={selectedId} onSelect={selectAccident} />
          </Suspense>
          {markers.isError && (
            <StatusMessage tone="error" as="div">
              {t.loadError}
            </StatusMessage>
          )}
        </>
      }
      sidebar={
        <>
          <CountersPanel stats={stats.data} filter={filter} year={year} now={now} onFilter={changeFilter} onYear={changeYear} />
          {selectedId !== null && (
            <AccidentPanel
              accident={accident.data}
              isLoading={accident.isLoading}
              isError={accident.isError}
              onClose={clearSelection}
            />
          )}
          <AboutCard links={siteLinks} status={status.data} reportTarget={reportTarget} />
        </>
      }
    />
  );
}
