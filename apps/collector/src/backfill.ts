#!/usr/bin/env node
/**
 * Recuperação histórica de um ano inteiro, fora da agenda diária (ignora o intervalo de 6h).
 * Uso: node dist/backfill.js [ano] [dias-por-janela]
 *
 * - Fontes de busca do Google News: a cláusula "when:Nd" é trocada por "after:/before:"
 *   em janelas de poucos dias, porque cada busca devolve no máximo ~100 itens.
 * - Feeds RSS próprios: lidos uma vez, aceitando itens desde 1º de janeiro do ano.
 * - Fontes HTML com proteção anti-robô (ASN) são puladas.
 *
 * Não usa LLM: a extração é por regras, então não consome tokens.
 */
import { createPool, migrate, type SourceRow } from '@aobtd/core';
import { NominatimGeocoder } from './geocode.js';
import { loadSources, scanSource, type ScanDeps, type ScanSummary } from './scanner.js';

const log = (msg: string) => process.stderr.write(`[backfill] ${new Date().toISOString()} ${msg}\n`);
const day = (d: Date) => d.toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const WHEN = /\+?when:\d+[dhmy]/;

/** Janelas [início, fim) de `stepDays` dias, de 1º de janeiro até amanhã (ou fim do ano). */
export function windows(year: number, stepDays: number, now: Date): Array<[Date, Date]> {
  const end = Math.min(Date.UTC(year + 1, 0, 1), Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const out: Array<[Date, Date]> = [];
  for (let t = Date.UTC(year, 0, 1); t < end; t += stepDays * 86_400_000) {
    out.push([new Date(t), new Date(Math.min(t + stepDays * 86_400_000, end))]);
  }
  return out;
}

export function rangedUrl(feedUrl: string, from: Date, to: Date): string {
  return feedUrl.replace(WHEN, `+after:${day(from)}+before:${day(to)}`);
}

async function main() {
  const now = new Date();
  const year = Number(process.argv[2] ?? now.getUTCFullYear());
  const stepDays = Number(process.argv[3] ?? 10);
  const db = createPool();
  await migrate(db, log);
  const deps: ScanDeps = { db, geocoder: new NominatimGeocoder(db), log };
  const since = new Date(Date.UTC(year, 0, 1));
  const before = Number((await db.query<{ n: number }>('SELECT count(*) AS n FROM accidents')).rows[0]!.n);
  const totals = { requests: 0, seen: 0, relevant: 0, newArticles: 0, newAccidents: 0, unlocated: 0, errors: 0 };
  const add = (s: ScanSummary) => {
    totals.requests++;
    totals.seen += s.seen;
    totals.relevant += s.relevant;
    totals.newArticles += s.newArticles;
    totals.newAccidents += s.newAccidents;
    totals.unlocated += s.unlocated;
    if (s.status === 'error') totals.errors++;
  };

  for (const source of (await loadSources(db)).filter((s: SourceRow) => s.enabled)) {
    if (source.parser !== 'rss') {
      log(`${source.slug}: pulada (fonte HTML, sem histórico acessível)`);
      continue;
    }
    if (source.feed_url.includes('news.google.com') && WHEN.test(source.feed_url)) {
      for (const [from, to] of windows(year, stepDays, now)) {
        add(await scanSource(deps, source, { url: rangedUrl(source.feed_url, from, to), since }));
        await sleep(1500); // educado com o Google News
      }
    } else {
      add(await scanSource(deps, source, { url: source.feed_url, since }));
    }
  }

  const after = Number((await db.query<{ n: number }>('SELECT count(*) AS n FROM accidents')).rows[0]!.n);
  const inYear = await db.query<{ n: number }>(
    'SELECT count(*) AS n FROM accidents WHERE occurred_at >= $1 AND occurred_at < $2',
    [since, new Date(Date.UTC(year + 1, 0, 1))],
  );
  log(
    `fim: ${totals.requests} requisições, ${totals.seen} itens, ${totals.relevant} relevantes, ` +
      `${totals.newArticles} notícias novas, ${totals.newAccidents} acidentes novos, ${totals.unlocated} sem local, ` +
      `${totals.errors} erros | acidentes no banco: ${before} -> ${after} (${inYear.rows[0]!.n} em ${year}) | tokens de LLM: 0`,
  );
  await db.end();
}

if (process.argv[1]?.match(/backfill\.(ts|js)$/)) {
  main().catch((err) => {
    log(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exit(1);
  });
}

