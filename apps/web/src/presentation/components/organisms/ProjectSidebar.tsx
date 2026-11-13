import { ArrowRightIcon, HeartIcon, StarIcon } from 'lucide-react';
import { memo } from 'react';
import { reportIssueUrl, type IssueTarget, type SiteLinks } from '../../../config/siteLinks';
import type { CollectionStatus } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { ExternalLink } from '../atoms/ExternalLink';
import { Logo } from '../atoms/Logo';
import { FactList } from '../molecules/FactList';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface Props {
  links: SiteLinks;
  status: CollectionStatus | undefined;
  /** Accident open in the details panel, so an error report already names it. */
  reportTarget: IssueTarget | null;
}

/** The menu is 190-220px wide: button labels wrap instead of overflowing (shadcn buttons are nowrap). */
const WRAP = 'h-auto min-h-8 py-1.5 whitespace-normal';

/** GitHub mark: lucide-react no longer ships brand icons. */
const GitHubMark = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);

/** Full-height left menu: brand, collection status, support and feedback links, repository badge. */
export const ProjectSidebar = memo(function ProjectSidebar({ links, status, reportTarget }: Props) {
  const { t, fmt } = useI18n();
  const lastUpdate = !status ? t.loading : status.lastScanAt ? fmt.dateTime(status.lastScanAt) : t.noCollectionYet;
  const pageUrl = typeof location === 'undefined' ? '' : location.origin + location.pathname;

  return (
    <nav className="flex min-h-full flex-col gap-4 p-4 text-sm" aria-label={t.about}>
      <div className="grid justify-items-start gap-2.5">
        <Logo size={44} />
        <strong className="text-base leading-snug">{t.tagline}</strong>
      </div>

      <Separator />
      <FactList
        layout="stacked"
        facts={[
          { term: t.lastUpdate, value: lastUpdate },
          { term: t.monitoredSources, value: fmt.count(status?.sources) },
        ]}
      />

      <Separator />
      <section className="grid gap-2">
        <p className="text-muted-foreground">{t.supportText}</p>
        {links.donations.map((d) => (
          <Button key={d.id} asChild size="sm" className={WRAP}>
            <ExternalLink href={d.url}>
              <HeartIcon />
              {d.label}
            </ExternalLink>
          </Button>
        ))}
        <Button asChild variant="outline" size="sm" className={WRAP}>
          <ExternalLink href={links.repo}>
            <StarIcon />
            {t.starOnGitHub}
          </ExternalLink>
        </Button>
      </section>

      <Separator />
      <section className="grid justify-items-start gap-1">
        <p className="text-muted-foreground">{t.reportError}</p>
        <Button asChild variant="link" className="h-auto p-0">
          <ExternalLink href={reportIssueUrl(links.repo, reportTarget, pageUrl)}>
            {t.reportErrorAction}
            <ArrowRightIcon />
          </ExternalLink>
        </Button>
      </section>

      <footer className="mt-auto border-t pt-4">
        <Badge asChild variant="outline" className="hover:border-foreground">
          <ExternalLink href={links.repo} title={t.viewCode}>
            <GitHubMark />
            {t.openSource}
          </ExternalLink>
        </Badge>
      </footer>
    </nav>
  );
});
