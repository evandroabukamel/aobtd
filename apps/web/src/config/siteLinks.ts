/**
 * Project links, read at build time from VITE_* variables (see .env.example).
 * Only https URLs are accepted, so a bad value can never become a script link.
 */
export interface DonationLink {
  id: 'github-sponsors' | 'kofi' | 'buymeacoffee';
  label: string;
  url: string;
}

export interface SiteLinks {
  repo: string;
  donations: DonationLink[];
}

const DEFAULT_REPO = 'https://github.com/evandroabukamel/aobtd';

export function safeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.href.replace(/\/$/, '') : undefined;
  } catch {
    return undefined;
  }
}

export function readSiteLinks(env: ImportMetaEnv): SiteLinks {
  const candidates: [DonationLink['id'], string, string | undefined][] = [
    ['github-sponsors', 'GitHub Sponsors', env.VITE_GITHUB_SPONSORS_URL],
    ['kofi', 'Ko-fi', env.VITE_KOFI_URL],
    ['buymeacoffee', 'Buy Me a Coffee', env.VITE_BUYMEACOFFEE_URL],
  ];
  return {
    repo: safeUrl(env.VITE_REPO_URL) ?? DEFAULT_REPO,
    donations: candidates.flatMap(([id, label, raw]) => {
      const url = safeUrl(raw);
      return url ? [{ id, label, url }] : [];
    }),
  };
}

export const siteLinks = readSiteLinks(import.meta.env);

export interface IssueTarget {
  id: number;
  location: string | null;
}

/** GitHub "new issue" link, pre-filled with the accident on screen when there is one. */
export function reportIssueUrl(repo: string, target: IssueTarget | null, pageUrl: string): string {
  const title = target
    ? `Wrong data: accident #${target.id}${target.location ? ` (${target.location})` : ''}`
    : 'Wrong data on the map';
  const body = [
    target ? `Accident: #${target.id}${target.location ? ` - ${target.location}` : ''}` : null,
    `Page: ${pageUrl}`,
    '',
    'What is wrong (location, date, aircraft, fatalities, source)?',
    '',
    'What is correct, and where did you see it (link)?',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
  const q = new URLSearchParams({ title, body });
  return `${repo}/issues/new?${q}`;
}
