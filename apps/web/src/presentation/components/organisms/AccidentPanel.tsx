import type { AccidentDetail } from '../../../domain/accident';
import { formatDate } from '../../shared/format';
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

/** Detalhes e lista de fontes do acidente selecionado no mapa. */
export function AccidentPanel({ accident, isLoading, isError, onClose }: Props) {
  return (
    <section className="panel" aria-live="polite">
      <div className="panel-head">
        <h2>{accident?.location ?? 'Acidente'}</h2>
        <CloseButton onClick={onClose} />
      </div>
      {isLoading && <StatusMessage tone="muted">Carregando fontes…</StatusMessage>}
      {isError && <StatusMessage tone="error">Não foi possível carregar as fontes.</StatusMessage>}
      {accident && (
        <>
          <FactList
            facts={[
              { term: 'Data', value: formatDate(accident.occurredAt) },
              { term: 'Aeronave', value: accident.aircraft ?? 'não informada' },
              { term: 'Vítimas fatais', value: accident.fatalities ?? 'não informado' },
            ]}
          />
          <h3>Fontes ({accident.articles.length})</h3>
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
