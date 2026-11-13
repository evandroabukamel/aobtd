import { safeUrl } from './siteLinks';

/**
 * Where the site reaches the API, read at build time from VITE_API_URL (e.g. https://api.example.com).
 * Unset (or not https): same origin, through the web Worker's service binding or the dev proxy.
 */
export const readApiBaseUrl = (env: ImportMetaEnv): string => safeUrl(env.VITE_API_URL) ?? '';

export const apiBaseUrl = readApiBaseUrl(import.meta.env);
