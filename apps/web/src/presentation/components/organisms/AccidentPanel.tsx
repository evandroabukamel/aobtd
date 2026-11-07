import type { AccidentDetail } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { CloseButton } from '../atoms/CloseButton';
import { StatusMessage } from '../atoms/StatusMessage';
import { FactList } from '../molecules/FactList';
import { SourceItem } from '../molecules/SourceItem';

interface Props {
  accident: AccidentDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

/** Details and source list of the accident selected on the map. */
export function AccidentPanel({ accident, isLoading, isError, onClose }: Props) {
  const { t, fmt } = useI18n();
  return (
    <section className="panel" aria-live="polite">
      <div className="panel-head">
        <h2>{accident?.location ?? t.accident}</h2>
        <CloseButton onClick={onClose} label={t.close} />
      </div>
      {isLoading && <StatusMessage tone="muted">{t.loadingSources}</StatusMessage>}
      {isError && <StatusMessage tone="error">{t.sourcesError}</StatusMessage>}
      {accident && (
        <>
          <FactList
            facts={[
              { term: t.date, value: fmt.date(accident.occurredAt) },
              { term: t.aircraft, value: accident.aircraft ?? t.notReported },
              { term: t.fatalities, value: accident.fatalities ?? t.notReported },
            ]}
          />
          <h3>{t.sources(accident.articles.length)}</h3>
          <ul className="sources">
            {accident.articles.map((a) => (
              <SourceItem key={a.url} article={a} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
