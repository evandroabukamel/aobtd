import * as cheerio from 'cheerio';
import type { RawItem } from './types.js';

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** "05-Nov-2026" / "5 Nov 2026" -> Date UTC. */
export function parseAsnDate(s: string): Date | undefined {
  const m = s.trim().match(/^(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-](\d{4})$/);
  if (!m) return undefined;
  const month = MONTHS[m[2]!.toLowerCase()];
  if (month === undefined) return undefined;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[1]), 12));
}

/** Danos que caracterizam queda: destruída (w/o) ou dano substancial (sub). */
const CRASH_DAMAGE = /^(w\/o|sub|des)/i;

/**
 * Lê a tabela da lista do Wikibase da ASN. As colunas são identificadas pelo cabeçalho,
 * para tolerar mudanças de ordem no layout.
 */
export function parseAsnList(html: string, baseUrl: string): RawItem[] {
  const $ = cheerio.load(html);
  const items: RawItem[] = [];

  $('table').each((_, table) => {
    const headers = $(table)
      .find('tr')
      .first()
      .find('th, td')
      .map((__, c) => $(c).text().trim().toLowerCase())
      .get();
    const col = (name: string) => headers.findIndex((h) => h.startsWith(name));
    const iDate = col('acc. date') >= 0 ? col('acc. date') : col('date');
    const iType = col('type');
    const iFat = col('fat');
    const iLoc = col('location');
    const iDmg = col('dmg');
    if (iDate < 0 || iLoc < 0) return;

    $(table)
      .find('tr')
      .slice(1)
      .each((__, tr) => {
        const cells = $(tr).find('td');
        const cell = (i: number) => (i >= 0 ? cells.eq(i).text().replace(/\s+/g, ' ').trim() : '');
        const href = cells.eq(iDate).find('a').attr('href') ?? $(tr).find('a[href*="wikibase/"]').first().attr('href');
        const occurredAt = parseAsnDate(cell(iDate));
        const location = cell(iLoc);
        const damage = cell(iDmg);
        if (!href || !occurredAt || !location) return;
        if (iDmg >= 0 && damage && !CRASH_DAMAGE.test(damage)) return;
        const fatText = cell(iFat);
        const fatalities = /^\d+$/.test(fatText) ? Number(fatText) : undefined;
        const aircraft = cell(iType) || undefined;
        items.push({
          url: new URL(href, baseUrl).toString(),
          title: `${aircraft ?? 'Aeronave'} - ${location}`,
          occurredAt,
          publishedAt: occurredAt,
          location,
          aircraft,
          fatalities,
          structured: true,
        });
      });
  });
  return items;
}
