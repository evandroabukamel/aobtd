# Aircraft crash monitor

A web page with a map of **manned aircraft** crashes in the last 24 hours, in the current month and in each month of any year, with counters next to the map. Clicking a marker shows the list of news reports and official statements that mention the accident.

The site is available in 10 languages: Portuguese (Brazil), Portuguese (Portugal), English, Spanish, German, French, Simplified Chinese, Japanese, Russian and Ukrainian. The flag button in the top right corner opens a language menu.

Collection is done by an **MCP server**, which scans each source once a day and stores everything in **PostgreSQL**.

## Architecture

```
apps/collector   MCP server + scheduler: reads the sources, filters, geocodes and stores
apps/api         HTTP API (Fastify) that also serves the site in production
apps/web         Site in React + Vite + Leaflet
packages/core    Shared types, database connection and migrations
```

```
sources (RSS/Atom/HTML) ──► collector (MCP) ──► PostgreSQL ◄── api ◄── web
                                   ▲
                     MCP client (Claude, etc.)
```

### Collection schedule

Each source belongs to one of four daily windows: **00h, 06h, 12h and 18h UTC** (column `sources.scan_slot`). So each site is scanned **once a day**, with 6h between one group of sources and the next.

The control lives in the database: before scanning, the collector "claims" the source with an atomic `UPDATE` that only succeeds if it hasn't been scanned in the period yet. Restarting the process or running more than one instance doesn't cause extra scans, and a window missed while the server was down is caught up when it comes back.

### How a news item becomes a marker

1. **Thrifty download:** conditional GET (`ETag`/`Last-Modified`), size limit and timeout. URLs already stored are dropped before any processing.
2. **Rule-based filter, no LLM** (zero token cost): the item must mention an aircraft and a crash (in Portuguese, English, French or German) and must not be about drones, model aircraft, missiles, satellites, inspections, recalls or lawsuits. Items that cite a year before their publication are follow-ups on old accidents and are dropped too.
3. **Extraction:** location, number of fatalities ("6 aboard, no survivors" counts as 6), aircraft model and date ("yesterday" is adjusted). State codes such as MG, SC or NSW are expanded to the full name and country before geocoding.
4. **Geocoding** with Nominatim (OpenStreetMap), at most 1 query per second and with a permanent cache in the database (not-found places included). Items without an identifiable location don't go on the map.
5. **Grouping:** items within 60 km and 48h of each other become the same accident, which then lists every source.

### Sources

| Window | Source | Kind | How it is read |
|---|---|---|---|
| 00h | Aviation Safety Network (Flight Safety Foundation) | Database | Wikibase list (HTML), only `w/o` and `sub` damage |
| 00h | BBC News | Agency | RSS |
| 00h | CENIPA (Brazilian Air Force) | Official body | Google News RSS search |
| 06h | Reuters | Agency | Google News RSS search (`site:reuters.com`) |
| 06h | NTSB (USA) | Official body | Google News RSS search |
| 06h | BEA (France) | Official body | Google News RSS search |
| 12h | Associated Press | Agency | Google News RSS search (`site:apnews.com`) |
| 12h | AAIB (United Kingdom) | Official body | gov.uk Atom feed |
| 12h | TSB (Canada) | Official body | Google News RSS search |
| 18h | Agência Brasil (EBC) | Agency | RSS |
| 18h | ATSB (Australia) | Official body | Google News RSS search |
| 18h | FAA (USA) | Official body | Google News RSS search |
| 18h | BFU (Germany) | Official body | Google News RSS search |

Reuters, AP and most investigation bodies don't publish their own RSS; for them the Google News search already filters for accidents and returns few items. Sources live in the `sources` table and can be enabled, disabled or moved to another window without code changes.

The ASN website currently answers automated requests with HTTP 403, so that source gets no data.

## Running it

### With Docker

```bash
docker compose up --build
```

- Site and API: http://localhost:3000
- MCP server (Streamable HTTP): http://localhost:3333/mcp

### In development

Requires Node.js 20.11+ and PostgreSQL 14+.

```bash
cp .env.example .env          # set DATABASE_URL
npm install
npm run db:migrate
npm run dev:api               # API on :3000
npm run dev:web               # site on :5173 (proxies to the API)
npm run dev:collector         # MCP collector on :3333 with the scheduler on
```

### Backfilling and reprocessing

```bash
npm run backfill -w @aobtd/collector -- 2026   # collects a whole year, ignoring the 6h interval
npm run repair -w @aobtd/collector             # applies the current extraction rules to stored accidents
```

The backfill swaps the `when:2d` clause of the Google News searches for 10-day `after:`/`before:` windows. Neither command uses an LLM.

### Connecting the MCP server to a client

Over stdio (the client starts the process):

```json
{
  "mcpServers": {
    "aobtd": {
      "command": "node",
      "args": ["/path/to/aobtd/apps/collector/dist/index.js"],
      "env": { "DATABASE_URL": "postgres://aobtd:aobtd@localhost:5432/aobtd", "COLLECTOR_SCHEDULER": "off" }
    }
  }
}
```

Use `COLLECTOR_SCHEDULER=off` when another process (for example the `collector` container) already handles the schedule.

Exposed tools, all with short replies (one line per item):

| Tool | What it does |
|---|---|
| `list_sources` | Sources, window, last and next scan |
| `run_due_scans` | Scans the sources whose window has come |
| `scan_source` | Scans one source (`force: true` ignores the daily limit) |
| `query_accidents` | Lists accidents from the last 24h, the month, or a year/month |

## API

| Route | Response |
|---|---|
| `GET /api/accidents?period=24h` | Markers of the last 24h |
| `GET /api/accidents?period=month[&year=2026][&month=3]` | Current month, one month, or a whole year (no `month`) |
| `GET /api/stats?year=2026` | Counters: 24h, current month, year total, 12 months and available years |
| `GET /api/accidents/:id` | Details and list of sources of the accident |

Markers come as `[id, lat, lng, fatalities, epoch]` tuples to keep responses small. Responses carry `ETag` and `Cache-Control`.

## Site structure (`apps/web`)

The frontend follows Clean Architecture: dependencies always point inwards (`presentation` → `application` → `domain`), and only the composition root (`app/`) knows the HTTP implementation.

```
src/
  domain/            Pure rules, no React: filters, UTC calendar, entities
  application/       Use cases as hooks: screen state and queries (TanStack Query)
    ports/           AccidentRepository interface (what the application needs from the API)
  infrastructure/    Port implementations: repository over fetch
  i18n/              Typed dictionaries per language, Intl formatters, language detection
  presentation/      React, organized with Atomic Design
    components/
      atoms/         ToggleButton, CloseButton, Badge, StatusMessage, BarMeter
      molecules/     StatCard, MonthBar, YearSelect, FactList, SourceItem, MapCaption, LanguageSwitcher
      organisms/     AppHeader, CountersPanel, AccidentPanel, CrashMap
      templates/     DashboardTemplate (header, map and sidebar)
    pages/           DashboardPage: wires state and queries to the components
    shared/          Small UI helpers
  app/               Composition root: I18nProvider, QueryClient and repository injection
  main.tsx           Entry point
```

Atoms, molecules, organisms and templates only receive data through props; the page is what fetches data. To change the data origin (another API, test data), pass another `AccidentRepository` implementation in `app/App.tsx`.

### Languages

- Every string lives in `src/i18n/locales/<tag>.ts`, typed by the `Messages` interface, so a missing translation is a compile error.
- Month names, dates and numbers come from `Intl` in the chosen language, with no hand-written lists.
- The first visit picks the closest match to the browser languages (falling back to English); the choice is then kept in `localStorage`.
- Flags come from the `flag-icons` package (only the 10 used are bundled), except the Spanish one, which is a light local SVG.
- News titles are shown in their original language.

To add a language, create a file in `src/i18n/locales/` and add an entry to `LOCALES` in `src/i18n/locales.ts`.

## Site performance

- Leaflet with canvas rendering: thousands of markers without one DOM node per marker.
- The map is in a separate chunk loaded on demand; the counters panel shows up first.
- All counters in a single request; the source list is only fetched on click.
- Client cache (TanStack Query) of 6h per filter, matching the collection window: going back to a filter already fetched sends no new request.

## Tests

```bash
npm test                                                     # unit tests
TEST_DATABASE_URL=postgres://.../aobtd_test npm test         # includes integration (wipes that database's public schema!)
```

## Known limitations

- Location extraction is rule-based; titles without a place name stay off the map (counted as "without location" in the scan summary).
- Only article titles are stored, so fatalities that appear only in the article body are not picked up by `repair`.
- The ASN list is read through the table header; if the layout changes a lot, the parser in `apps/collector/src/parsers/asn.ts` needs updating.
