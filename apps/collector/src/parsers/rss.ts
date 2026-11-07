import { XMLParser } from 'fast-xml-parser';
import type { RawItem } from './types.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  processEntities: true,
  htmlEntities: true,
  // Avoids parsing elements we never use.
  stopNodes: ['*.content:encoded', '*.content'],
});

function text(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) return text((v as Record<string, unknown>)['#text']);
  return '';
}

function list<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function date(v: unknown): Date | undefined {
  const s = text(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function atomLink(v: unknown): string {
  for (const l of list(v as Record<string, string> | Record<string, string>[])) {
    if (typeof l === 'string') return l;
    if (!l['@rel'] || l['@rel'] === 'alternate') return l['@href'] ?? '';
  }
  return '';
}

/** Reads RSS 2.0 and Atom and returns normalized items. */
export function parseFeed(xml: string): RawItem[] {
  const doc = parser.parse(xml) as Record<string, any>;
  const items: RawItem[] = [];

  for (const it of list(doc.rss?.channel?.item)) {
    const url = text(it.link).trim() || text(it.guid).trim();
    const title = stripHtml(text(it.title));
    if (!url || !title) continue;
    items.push({ url, title, summary: stripHtml(text(it.description)).slice(0, 1000), publishedAt: date(it.pubDate) });
  }

  for (const e of list(doc.feed?.entry)) {
    const url = atomLink(e.link).trim();
    const title = stripHtml(text(e.title));
    if (!url || !title) continue;
    items.push({
      url,
      title,
      summary: stripHtml(text(e.summary)).slice(0, 1000),
      publishedAt: date(e.published) ?? date(e.updated),
    });
  }
  return items;
}
