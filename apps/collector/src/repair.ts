#!/usr/bin/env node
/**
 * Reprocesses stored accidents with the current extraction rules, using the titles
 * of each accident's articles:
 * - articles the current rules reject are removed, and accidents left without articles too;
 * - a location stored as a code (MG, SC, NSW...) is geocoded again by its full name;
 * - empty fatalities are filled when some title gives the number.
 * Usage: node dist/repair.js
 */
import { createPool } from '@aobtd/core';
import { cleanTitle, extractFatalities, extractLocations, isOffTopic, mentionsEarlierYear } from './extract.js';
import { NominatimGeocoder } from './geocode.js';

const log = (msg: string) => process.stderr.write(`[repair] ${msg}\n`);
const SHORT_CODE = /^[A-Z][A-Za-z.]{0,3}$/;

async function main() {
  const db = createPool();
  const geocoder = new NominatimGeocoder(db);

  // 1. Remove articles the current rules reject (safety flaw, lawsuit, old accident).
  const articles = await db.query<{ id: number; title: string; published_at: Date | null }>(
    `SELECT r.id, r.title, r.published_at FROM articles r JOIN sources s ON s.id = r.source_id WHERE s.parser <> 'asn_html'`,
  );
  const rejected = articles.rows
    .filter((r) => {
      const title = cleanTitle(r.title);
      // Only the title is stored: reject on what the title says, without requiring the positive keywords.
      return isOffTopic(title) || mentionsEarlierYear(title, r.published_at ?? undefined);
    })
    .map((r) => r.id);
  if (rejected.length) await db.query('DELETE FROM articles WHERE id = ANY($1)', [rejected]);
  const orphans = await db.query('DELETE FROM accidents a WHERE NOT EXISTS (SELECT 1 FROM articles r WHERE r.accident_id = a.id)');
  log(`${rejected.length} articles rejected, ${orphans.rowCount} accidents removed`);

  const { rows } = await db.query<{ id: number; location_name: string | null; fatalities: number | null; titles: string[] }>(
    `SELECT a.id, a.location_name, a.fatalities, array_agg(r.title ORDER BY r.id) AS titles
       FROM accidents a JOIN articles r ON r.accident_id = a.id GROUP BY a.id`,
  );
  let relocated = 0;
  let unresolved = 0;
  let fatalities = 0;

  for (const a of rows) {
    const titles = a.titles.map(cleanTitle);

    if (a.fatalities === null) {
      const found = titles.map(extractFatalities).find((n) => n !== undefined);
      if (found !== undefined) {
        await db.query('UPDATE accidents SET fatalities = $2, updated_at = now() WHERE id = $1', [a.id, found]);
        fatalities++;
      }
    }

    const candidates = [...new Set(titles.flatMap(extractLocations))].slice(0, 4);
    const isCode = !!a.location_name && SHORT_CODE.test(a.location_name) && a.location_name === a.location_name.toUpperCase();
    // A location that came from an expanded code and that the current rules read differently (e.g. LA).
    const isStaleExpansion = !!a.location_name && /, (USA|Brasil|Canada|Australia)$/.test(a.location_name)
      && candidates.length > 0 && !candidates.includes(a.location_name);
    if (isCode || isStaleExpansion) {
      let done = false;
      for (const place of candidates) {
        const hit = await geocoder.geocode(place);
        if (!hit) continue;
        await db.query(
          'UPDATE accidents SET location_name = $2, lat = $3, lng = $4, country = $5, updated_at = now() WHERE id = $1',
          [a.id, place, hit.lat, hit.lng, hit.country],
        );
        relocated++;
        done = true;
        break;
      }
      if (!done) {
        // No trustworthy location: take it off the map instead of showing it in the wrong country.
        await db.query('UPDATE accidents SET lat = NULL, lng = NULL, country = NULL, updated_at = now() WHERE id = $1', [a.id]);
        unresolved++;
      }
    }
  }
  log(`${rows.length} accidents reviewed: ${relocated} relocated, ${unresolved} without a trustworthy location, ${fatalities} with fatalities filled`);
  await db.end();
}

main().catch((err) => {
  log(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
