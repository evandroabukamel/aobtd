import type { Article } from '../../../domain/accident';
import { useI18n } from '../../../i18n/I18nContext';
import { Badge } from '../atoms/Badge';

export function SourceItem({ article }: { article: Article }) {
  const { t, fmt } = useI18n();
  return (
    <li>
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        {article.title}
      </a>
      <span className="meta">
        <Badge variant={article.sourceKind}>{t.kind[article.sourceKind]}</Badge>
        {article.source}
        {article.publishedAt && ` · ${fmt.date(article.publishedAt)}`}
      </span>
    </li>
  );
}
