import { memo } from 'react';
import { reportIssueUrl, type IssueTarget, type SiteLinks } from '../../../config/siteLinks';
import type { CollectionStatus } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { ExternalLink } from '../atoms/ExternalLink';
import { Logo } from '../atoms/Logo';
import { FactList } from '../molecules/FactList';

interface Props {
  links: SiteLinks;
  status: CollectionStatus | undefined;
  /** Accident open in the side panel, so an error report already names it. */
  reportTarget: IssueTarget | null;
}

/** Compact card at the bottom of the sidebar: brand, collection status, support and feedback links. */
export const AboutCard = memo(function AboutCard({ links, status, reportTarget }: Props) {
  const { t, fmt } = useI18n();
  const lastUpdate = !status ? t.loading : status.lastScanAt ? fmt.dateTime(status.lastScanAt) : t.noCollectionYet;
  const pageUrl = typeof location === 'undefined' ? '' : location.origin + location.pathname;

  return (
    <section className="about" aria-label={t.about}>
      <div className="about-brand">
        <Logo />
        <div>
          <strong>{t.tagline}</strong>
          <ExternalLink href={links.repo} className="about-source" title={t.viewCode}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            {t.openSource}
          </ExternalLink>
        </div>
      </div>

      <FactList
        facts={[
          { term: t.lastUpdate, value: lastUpdate },
          { term: t.monitoredSources, value: fmt.count(status?.sources) },
        ]}
      />

      <div className="about-support">
        <p>{t.supportText}</p>
        <div className="about-actions">
          {links.donations.map((d) => (
            <ExternalLink key={d.id} href={d.url} className={`about-button ${d.id}`}>
              {d.label}
            </ExternalLink>
          ))}
          <ExternalLink href={links.repo} className="about-button">
            ★ {t.starOnGitHub}
          </ExternalLink>
        </div>
      </div>

      <p className="about-report">
        {t.reportError}{' '}
        <ExternalLink href={reportIssueUrl(links.repo, reportTarget, pageUrl)}>{t.reportErrorAction}</ExternalLink>
      </p>

    </section>
  );
});
