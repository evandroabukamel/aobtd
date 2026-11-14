# aobtd: aircraft crash monitor

A map of **manned aircraft** crashes (last 24h, current month, any month or year), with counters
and the list of news reports for each accident. Full user docs: `README.md`. This file covers what
you need to change the code safely.

## Layout (npm workspaces, TypeScript, ESM)

```
packages/core    Shared types (src/types.ts), pg pool (src/db.ts), time windows (src/time.ts), migrations
apps/collector   MCP server + scheduler: fetch feeds -> filter -> extract -> geocode -> store
apps/api         Hono HTTP API (src/app.ts routes, src/queries.ts SQL); Node server or Cloudflare Worker
apps/web         React + Vite + Leaflet site, Clean Architecture + Atomic Design (see README "Site structure")
```

Data flow: `sources (RSS/Atom/HTML) -> collector -> DB <- api <- web`.

## Commands

```bash
npm run typecheck                      # tsc -b core, collector, api + web typecheck
npx vitest run apps/collector          # tests for one app (rtk's vitest filter fails here, call vitest directly)
npm test                               # all unit tests; integration tests need TEST_DATABASE_URL (never point it at prod)
npm run db:migrate                     # applies packages/core/migrations/*.sql in order
npm run backfill -w @aobtd/collector -- <year> [days-per-window] [slug,slug,...]
npm run repair -w @aobtd/collector     # re-applies extraction rules to stored accidents (titles only)
```

Running scripts against the configured DB without reading `.env`:
`cd apps/collector && npx tsx --env-file=../../.env src/backfill.ts 2025 10 nrk,svt`.
A full backfill takes ~1.5 s per Google News request; run it in the background and log to the scratchpad.

## Database

- **Production is TiDB Cloud** (PostgreSQL-compatible gateway), which is what `.env` points at. The local
  Docker Postgres (`aobtd-db-1`, `postgres://aobtd:aobtd@localhost:5432/aobtd`) is usually stopped.
- **`.env` is secret.** Never read or print it; pass it with `--env-file`.
- TiDB gaps: no `make_timestamptz`; `GROUP BY a.id` alone is rejected, so list every selected column.
  Compute time windows in TypeScript (`packages/core/src/time.ts`) and pass them as parameters.
  Don't write tests for TiDB quirks.
- Schema: `packages/core/migrations/001_init.sql`. Tables: `sources`, `accidents`, `articles`
  (URL unique, stores the **title only**), `scan_runs`, `geocode_cache`, `schema_migrations`.
- Migrations don't run on Workers. Apply them with `npm run db:migrate`; `backfill.ts` also applies them.
  Migrations are append-only: add `NNN_name.sql` and never edit an applied one.

## Collector (`apps/collector/src`)

| File | Role |
|---|---|
| `scanner.ts` | `scanSource`, `runDueScans`, `claimSource` (atomic UPDATE, so one scan per source per day) |
| `extract.ts` | Rule-based relevance filter and extraction (location, fatalities, model, date). **No LLM**, 0 tokens |
| `geocode.ts` | Nominatim, at most 1 request/s, permanent cache (including misses) in `geocode_cache` |
| `store.ts` | `saveArticle`: merges articles within 60 km and 48 h into one accident |
| `parsers/rss.ts`, `parsers/asn.ts` | RSS/Atom and ASN HTML (ASN answers 403; don't try to bypass it) |
| `schedule.ts` | 4 daily windows: `scan_slot` 0..3 = 00h/06h/12h/18h UTC |
| `mcp.ts` | MCP tools: `list_sources`, `run_due_scans`, `scan_source`, `query_accidents` |
| `backfill.ts` | Historical runs: replaces `when:2d` in Google News URLs with 10-day `after:/before:` windows |
| `worker.ts` / `index.ts` | Cloudflare cron (every 5 min) + `/mcp` behind `MCP_TOKEN` / Node stdio or `--http` |

Normal scans ignore items older than 7 days (`MAX_AGE_DAYS`). Backfill passes `since`.

### Extraction rules (`extract.ts`, tests in `test/extract.test.ts`)

- Languages understood: PT, EN, FR, DE, and NO/SV/DA (Nordic words live in separate `NORDIC_*`
  regexes because of compounds such as "passasjerfly" and non-ASCII letters, where `\b` fails).
  It does **not** understand Cyrillic, CJK or Hindi, so Asian and Russian outlets are read in English.
- An item is relevant when it matches AIRCRAFT + CRASH and not EXCLUDE (drones, missiles, shot down,
  inspections, recalls, lawsuits, anniversaries, stock market...). Titles that cite an earlier year
  are follow-ups and get dropped (`mentionsEarlierYear`).
- Known pitfalls, each covered by a test: state codes (MG, SC) geocoding to countries (Madagascar,
  Seychelles), "LA" = Los Angeles, "N aboard, no survivors" = N deaths, Nordic number words
  ("to", "sex") must not leak into English patterns.
- **Edit TS regexes with the Edit tool.** Bash heredocs on this Windows machine mangle backslashes.
- Write a failing test in `test/extract.test.ts` first, then change the regexes.

## Sources

- They live in the `sources` table, seeded by migrations `002_seed_sources.sql` and
  `003_asia_nordic_sources.sql`. To add or change sources, write a new migration
  (`kind` is `government` | `database` | `agency`; `parser` is `rss` | `asn_html`).
- **Use only official bodies and reliable outlets** (national agencies, public broadcasters,
  reference papers). No tabloids or sensationalist sites (excluded so far: Global Times,
  Times of India, NDTV).
- Most sources are Google News RSS searches (`site:domain` or the investigation body's name) with
  `+when:2d`, which the backfill needs in order to rewrite the URL. Before adding one, probe coverage:
  `curl -s -A "Mozilla/5.0" "https://news.google.com/rss/search?q=<query>+after:2025-01-01+before:2025-07-01&hl=..." | grep -c "<item>"`
  and read a few titles to check that the extractor would accept them.
- Not indexed by Google News (don't retry): DR, TV2 and the Danish investigation board, Interfax,
  xinhuanet.com (use english.news.cn), Korea JoongAng Daily, Japan Today, The Local.
- Spread new sources across the 4 `scan_slot` values. Source names follow the existing style
  (Portuguese country names in parentheses, e.g. `JTSB (Japão)`).
- Also update the sources table in `README.md`.

## API (`apps/api`)

Routes: `GET /api/accidents?period=24h|month[&year][&month]`, `/api/accidents/:id`, `/api/stats?year`,
`/api/status`. Markers are `[id, lat, lng, fatalities, epoch]` tuples, and responses carry `ETag`/`Cache-Control`.
Errors are logged as one JSON line (`event: "api.error"`) by `src/errorLog.ts`. CORS uses `ALLOWED_ORIGINS`.

## Web (`apps/web`)

- Dependencies point inwards: `presentation -> application -> domain`; only `app/` knows the HTTP repo.
  Components get data through props; pages fetch data.
- UI: shadcn/ui + Tailwind (`components.json`). Prefer existing library components over custom CSS.
- i18n: 10 locales in `src/i18n/locales/<tag>.ts`, typed by `Messages` (a missing key is a compile error).
  Any new string must be added to **all** locales. Register new locales in `src/i18n/locales.ts`.
- Dates and numbers come from `Intl`; news titles stay in their original language.
- `VITE_*` variables are baked in at build time (https only).

## Deployment

- Cloudflare Workers Builds deploys `aobtd-web`, `aobtd-api` and `aobtd-collector` from `main` on push
  (each from its own folder; see README "On Cloudflare Workers"). A collector code change, such as new
  extraction rules, reaches the daily scans only after it is pushed.
- Docker alternative: `docker compose up --build` (site/API :3000, MCP :3333/mcp).
- Commit or push only when the user asks.

## Data-quality workflow

1. Reproduce with a real title in `test/extract.test.ts`.
2. Fix `extract.ts`, then run `npx vitest run apps/collector`.
3. Run `repair` to re-apply the rules to stored accidents, or `backfill` (with a slug list) to fetch history.
4. Report the backfill's `done:` line (requests, relevant, new accidents, without location).

<!-- claude-reflect: learned rules (saved from the band; edit freely) -->
## Learned rules
- For this project, use only official sources and reliable news portals, and avoid sensationalist content.
<!-- end claude-reflect -->
