/**
 * A coleta roda em janelas de 6h: dados de um filtro já consultado não mudam antes disso.
 * staleTime evita nova requisição; gcTime mantém o resultado guardado mesmo quando o
 * filtro deixa de estar na tela, para que voltar a ele não refaça a consulta.
 */
export const FILTER_CACHE_MS = 6 * 60 * 60_000;

export const filterCache = { staleTime: FILTER_CACHE_MS, gcTime: FILTER_CACHE_MS } as const;
