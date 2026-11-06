import { useQuery } from '@tanstack/react-query';
import { fetchAccident } from './api';
import { formatDate, KIND_LABEL } from './format';

/** Lista de fontes de um acidente: carregada só quando o marcador é clicado. */
export function AccidentPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['accident', id],
    queryFn: ({ signal }) => fetchAccident(id, signal),
    staleTime: 30 * 60_000,
  });

  return (
    <section className="panel" aria-live="polite">
      <div className="panel-head">
        <h2>{data?.location ?? 'Acidente'}</h2>
        <button className="close" onClick={onClose} aria-label="Fechar">×</button>
      </div>
      {isLoading && <p className="muted">Carregando fontes…</p>}
      {isError && <p className="error">Não foi possível carregar as fontes.</p>}
      {data && (
        <>
          <dl className="facts">
            <div><dt>Data</dt><dd>{formatDate(data.occurredAt)}</dd></div>
            <div><dt>Aeronave</dt><dd>{data.aircraft ?? 'não informada'}</dd></div>
            <div><dt>Vítimas fatais</dt><dd>{data.fatalities ?? 'não informado'}</dd></div>
          </dl>
          <h3>Fontes ({data.articles.length})</h3>
          <ul className="sources">
            {data.articles.map((a) => (
              <li key={a.url}>
                <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a>
                <span className="meta">
                  <span className={`badge ${a.sourceKind}`}>{KIND_LABEL[a.sourceKind]}</span>
                  {a.source}
                  {a.publishedAt && ` · ${formatDate(a.publishedAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
