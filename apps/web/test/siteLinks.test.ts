import { describe, expect, it } from 'vitest';
import { readSiteLinks, reportIssueUrl, safeUrl } from '../src/config/siteLinks';

describe('site links', () => {
  it('accepts only https URLs', () => {
    expect(safeUrl('https://ko-fi.com/me/')).toBe('https://ko-fi.com/me');
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('http://ko-fi.com/me')).toBeUndefined();
    expect(safeUrl('')).toBeUndefined();
  });

  it('shows only the donation links that are set and falls back to the default repo', () => {
    const links = readSiteLinks({ VITE_KOFI_URL: 'https://ko-fi.com/me' } as ImportMetaEnv);
    expect(links.repo).toBe('https://github.com/evandroabukamel/aobtd');
    expect(links.donations).toEqual([{ id: 'kofi', label: 'Ko-fi', url: 'https://ko-fi.com/me' }]);
  });

  it('pre-fills the issue with the selected accident', () => {
    const url = new URL(reportIssueUrl('https://github.com/o/r', { id: 7, location: 'Madagascar' }, 'https://site/'));
    expect(url.pathname).toBe('/o/r/issues/new');
    expect(url.searchParams.get('title')).toBe('Wrong data: accident #7 (Madagascar)');
    expect(url.searchParams.get('body')).toContain('Page: https://site/');
    const generic = new URL(reportIssueUrl('https://github.com/o/r', null, 'https://site/'));
    expect(generic.searchParams.get('title')).toBe('Wrong data on the map');
  });
});
