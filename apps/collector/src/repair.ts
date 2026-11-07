#!/usr/bin/env node
/**
 * Reprocessa acidentes já gravados com as regras de extração atuais, usando os títulos
 * das notícias de cada acidente:
 * - local gravado como sigla (MG, SC, NSW...) é geocodificado de novo pelo nome completo;
 * - vítimas fatais vazias são preenchidas quando algum título traz o número.
 * Uso: node dist/repair.js
 */
import { createPool } from '@aobtd/core';
import { cleanTitle, extractFatalities, extractLocations } from './extract.js';
import { NominatimGeocoder } from './geocode.js';

const log = (msg: string) => process.stderr.write(`[repair] ${msg}\n`);
const SHORT_CODE = /^[A-Z][A-Za-z.]{0,3}$/;

async function main() {
  const db = createPool();
  const geocoder = new NominatimGeocoder(db);
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

    if (a.location_name && SHORT_CODE.test(a.location_name) && a.location_name === a.location_name.toUpperCase()) {
      let done = false;
      for (const place of titles.flatMap(extractLocations).slice(0, 4)) {
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
