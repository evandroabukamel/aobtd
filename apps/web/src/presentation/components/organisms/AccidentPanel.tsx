import { XIcon } from 'lucide-react';
import type { AccidentDetail } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { FactList } from '../molecules/FactList';
import { SourceItem } from '../molecules/SourceItem';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

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
    <section className="grid gap-3" aria-live="polite">
      <Separator />
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold">{accident?.location ?? t.accident}</h2>
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={onClose} aria-label={t.close}>
          <XIcon />
        </Button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t.loadingSources}</p>}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t.sourcesError}</AlertDescription>
        </Alert>
      )}
      {accident && (
        <>
          <FactList
            facts={[
              { term: t.date, value: fmt.date(accident.occurredAt) },
              { term: t.aircraft, value: accident.aircraft ?? t.notReported },
              { term: t.fatalities, value: accident.fatalities ?? t.notReported },
            ]}
          />
          <h3 className="mt-1 text-sm font-semibold text-muted-foreground">{t.sources(accident.articles.length)}</h3>
          <ul className="grid gap-2.5 text-sm">
            {accident.articles.map((a) => (
              <SourceItem key={a.url} article={a} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
