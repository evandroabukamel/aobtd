import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAsnList } from '../src/parsers/asn.js';
import { parseFeed } from '../src/parsers/rss.js';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('parsers', () => {
  it('reads RSS 2.0 and strips HTML from the description', () => {
    const items = parseFeed(fixture('feed.rss.xml'));
    expect(items).toHaveLength(6);
    expect(items[0]).toMatchObject({ url: 'https://example.com/a1', summary: 'A Cessna 172 went down shortly after takeoff.' });
    expect(items[0]!.publishedAt?.toISOString()).toBe('2026-11-05T10:00:00.000Z');
  });

  it('reads Atom', () => {
    const [item] = parseFeed(fixture('feed.atom.xml'));
    expect(item).toMatchObject({ url: 'https://www.gov.uk/aaib-reports/x', title: 'Helicopter crashed near Inverness' });
  });

  it('reads the ASN list and keeps only crash damage', () => {
    const items = parseAsnList(fixture('asn.html'), 'https://asn.flightsafety.org/wikibase/dblist.php');
    expect(items.map((i) => i.url)).toEqual([
      'https://asn.flightsafety.org/wikibase/500001',
      'https://asn.flightsafety.org/wikibase/500003',
    ]);
    expect(items[0]).toMatchObject({ location: 'Manaus, AM', fatalities: 3, aircraft: 'Cessna 208B Grand Caravan', structured: true });
    expect(items[1]!.fatalities).toBeUndefined();
  });
});
