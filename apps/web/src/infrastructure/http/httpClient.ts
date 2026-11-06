export type HttpGet = <T>(path: string, signal?: AbortSignal) => Promise<T>;

export const fetchJson: HttpGet = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const res = await fetch(path, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Erro ${res.status} ao consultar ${path}`);
  return res.json() as Promise<T>;
};
