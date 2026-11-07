#!/usr/bin/env node
/**
 * Reprocessa acidentes já gravados com as regras de extração atuais, usando os títulos
 * das notícias de cada acidente:
 * - local gravado como sigla (MG, SC, NSW...) é geocodificado de novo pelo nome completo;
 * - vítimas fatais vazias são preenchidas quando algum título traz o número.
 * Uso: node dist/repair.js
 */
import { createPool } from '@aobtd/core';
import { cleanTitle, extractFatalities, extractLocations, isOffTopic, mentionsEarlierYear } from './extract.js';
import { NominatimGeocoder } from './geocode.js';

const log = (msg: string) => process.stderr.write(`[repair] ${msg}\n`);
const SHORT_CODE = /^[A-Z][A-Za-z.]{0,3}$/;

async function main() {
  const db = createPool();
  const geocoder = new NominatimGeocoder(db);

  // 1. Remove notícias que as regras atuais rejeitam (falha de segurança, processo, acidente antigo).
  const articles = await db.query<{ id: number; title: string; published_at: Date | null }>(
    `SELECT r.id, r.title, r.published_at FROM articles r JOIN sources s ON s.id = r.source_id WHERE s.parser <> 'asn_html'`,
  );
  const rejected = articles.rows
    .filter((r) => {
      const title = cleanTitle(r.title);
      // Só o título está gravado: rejeita pelo que o título afirma, sem exigir as palavras positivas.
      return isOffTopic(title) || mentionsEarlierYear(title, r.published_at ?? undefined);
    })
    .map((r) => r.id);
  if (rejected.length) await db.query('DELETE FROM articles WHERE id = ANY($1)', [rejected]);
  const orphans = await db.query('DELETE FROM accidents a WHERE NOT EXISTS (SELECT 1 FROM articles r WHERE r.accident_id = a.id)');
  log(`${rejected.length} notícias rejeitadas, ${orphans.rowCount} acidentes removidos`);

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
    // Local que veio de uma sigla expandida e que as regras atuais leem de outro jeito (ex.: LA).
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
        // Sem local confiável: tira do mapa em vez de mostrar no país errado.
        await db.query('UPDATE accidents SET lat = NULL, lng = NULL, country = NULL, updated_at = now() WHERE id = $1', [a.id]);
        unresolved++;
      }
    }
  }
  log(`${rows.length} acidentes revistos: ${relocated} relocalizados, ${unresolved} sem local confiável, ${fatalities} com vítimas preenchidas`);
  await db.end();
}

main().catch((err) => {
  log(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
