import type { Article } from '../../../domain/accident';
import { formatDate, KIND_LABEL } from '../../shared/format';
import { Badge } from '../atoms/Badge';

export function SourceItem({ article }: { article: Article }) {
  return (
    <li>
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        {article.title}
      </a>
      <span className="meta">
        <Badge variant={article.sourceKind}>{KIND_LABEL[article.sourceKind]}</Badge>
        {article.source}
        {article.publishedAt && ` · ${formatDate(article.publishedAt)}`}
      </span>
    </li>
  );
}
