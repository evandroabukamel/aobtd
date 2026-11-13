import type { Article, SourceKind } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { ExternalLink } from '../atoms/ExternalLink';
import { Badge } from '../ui/badge';

const KIND_STYLE: Record<SourceKind, string> = {
  government: 'border-kind-government text-kind-government',
  database: 'border-kind-database text-kind-database',
  agency: 'text-muted-foreground',
};

export function SourceItem({ article }: { article: Article }) {
  const { t, fmt } = useI18n();
  return (
    <li>
      <ExternalLink
        href={article.url}
        className="font-medium underline decoration-border underline-offset-2 transition-colors hover:decoration-primary"
      >
        {article.title}
      </ExternalLink>
      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Badge variant="outline" className={KIND_STYLE[article.sourceKind]}>
          {t.kind[article.sourceKind]}
        </Badge>
        {article.source}
        {article.publishedAt && ` · ${fmt.date(article.publishedAt)}`}
      </span>
    </li>
  );
}
