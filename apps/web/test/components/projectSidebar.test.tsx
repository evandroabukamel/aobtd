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
    expect(new URL(href).searchParams.get('body')).toContain(`Page: ${location.origin}${location.pathname}`);
  });

  it('hides the Pix button when no Pix code is configured', () => {
    renderWithI18n(<ProjectSidebar links={links} status={undefined} reportTarget={null} />);
    expect(screen.queryByRole('button', { name: /pix/i })).not.toBeInTheDocument();
  });

  it('opens the Pix dialog with the QR code, the recipient and a copyable code', async () => {
    const code = '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865802BR5901A6001B62070503***6304ABCD';
    const pix = { code, key: 'key-123', name: 'Jane Doe', reference: 'AircraftCrashMonitor' };
    const { user } = renderWithI18n(<ProjectSidebar links={{ ...links, pix }} status={undefined} reportTarget={null} />);

    await user.click(screen.getByRole('button', { name: 'Donate via Pix' }));
    const dialog = await screen.findByRole('dialog', { name: 'Donate via Pix' });
    expect(await screen.findByRole('img', { name: 'Pix QR code' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent('key-123');
    expect(dialog).toHaveTextContent('Jane Doe');
    expect(dialog).toHaveTextContent('AircraftCrashMonitor');
    const field = screen.getByLabelText('Pix copy and paste code');
    expect(field).toBeDisabled();
    expect(field).toHaveValue(code);

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    // user-event replaces the clipboard with an in-memory stub.
    expect(await navigator.clipboard.readText()).toBe(code);
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});
