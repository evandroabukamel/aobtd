// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SiteLinks } from '../../src/config/siteLinks';
import { ProjectSidebar } from '../../src/presentation/components/organisms/ProjectSidebar';
import { renderWithI18n } from './renderWithI18n';

const links: SiteLinks = {
  repo: 'https://github.com/o/r',
  donations: [{ id: 'kofi', label: 'Ko-fi', url: 'https://ko-fi.com/me' }],
};

describe('ProjectSidebar', () => {
  it('shows the collection status', () => {
    renderWithI18n(<ProjectSidebar links={links} status={{ lastScanAt: '2026-03-02T06:00:00Z', sources: 1500 }} reportTarget={null} />);
    expect(screen.getByText('Last update').nextSibling).toHaveTextContent('3/2/26, 6:00 AM UTC');
    expect(screen.getByText('Monitored sources').nextSibling).toHaveTextContent('1,500');
  });

  it('says when nothing was collected yet', () => {
    renderWithI18n(<ProjectSidebar links={links} status={{ lastScanAt: null, sources: 0 }} reportTarget={null} />);
    expect(screen.getByText('Last update').nextSibling).toHaveTextContent('no collection yet');
  });

  it('links to donations and the repository in new tabs', () => {
    renderWithI18n(<ProjectSidebar links={links} status={undefined} reportTarget={null} />);
    expect(screen.getByRole('link', { name: 'Ko-fi' })).toHaveAttribute('href', 'https://ko-fi.com/me');
    const star = screen.getByRole('link', { name: /star on github/i });
    expect(star).toHaveAttribute('href', 'https://github.com/o/r');
    expect(star).toHaveAttribute('target', '_blank');
  });

  it('pre-fills the error report with the selected accident', () => {
    renderWithI18n(<ProjectSidebar links={links} status={undefined} reportTarget={{ id: 7, location: 'Madagascar' }} />);
    const href = screen.getByRole('link', { name: /report it/i }).getAttribute('href')!;
    expect(new URL(href).searchParams.get('title')).toBe('Wrong data: accident #7 (Madagascar)');
  });
});
