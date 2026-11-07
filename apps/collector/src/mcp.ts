import { currentMonthRange, last24h, monthRange, type Db } from '@aobtd/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { claimSource, formatSummary, loadSources, runDueScans, scanSource, type ScanDeps } from './scanner.js';
import { nextRun } from './schedule.js';

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const hhmm = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace('T', ' ') + 'Z' : 'never');

/**
 * The collector's MCP tools. Replies are short text, one line per item,
 * so the client calling the server spends few tokens.
 */
export function createMcpServer(deps: ScanDeps): McpServer {
  const server = new McpServer({ name: 'aobtd-collector', version: '0.1.0' });
  const { db } = deps;

  server.registerTool(
    'list_sources',
    {
      description: 'Lists the monitored sources, the daily window of each one (UTC) and the state of the last scan.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const now = new Date();
      const lines = (await loadSources(db)).map(
        (s) =>
          `${s.slug} | ${s.enabled ? 'enabled' : 'disabled'} | window ${String(s.scan_slot * 6).padStart(2, '0')}h | ` +
          `last ${hhmm(s.last_scan_at)} (${s.last_status ?? '-'}) | next ${hhmm(nextRun(s.scan_slot, s.last_scan_at, now))}` +
          (s.last_error ? ` | error: ${s.last_error}` : ''),
      );
      return text(lines.join('\n'));
    },
  );

  server.registerTool(
    'run_due_scans',
    {
      description:
        'Scans the sources whose daily window has started and that were not scanned yet in this period. Each source is scanned at most once a day.',
    },
    async () => {
      const results = await runDueScans(deps);
      return text(results.length ? results.map(formatSummary).join('\n') : 'No source is due right now.');
    },
  );

  server.registerTool(
    'scan_source',
    {
      description:
        'Scans one source. Without force it respects the one-scan-a-day limit; force=true ignores it (manual use).',
      inputSchema: { slug: z.string().describe('Source identifier, e.g. "bbc"'), force: z.boolean().optional() },
    },
    async ({ slug, force }) => {
      const source = (await loadSources(db)).find((s) => s.slug === slug);
      if (!source) return { ...text(`Source "${slug}" not found.`), isError: true };
      if (!(await claimSource(db, source, new Date(), force ?? false))) {
        return text(`${slug}: already scanned in this period (${hhmm(source.last_scan_at)}). Use force=true to repeat.`);
      }
      return text(formatSummary(await scanSource(deps, source)));
    },
  );

  server.registerTool(
    'query_accidents',
    {
      description: 'Lists stored accidents: last 24h, current month, or a specific month/year.',
      inputSchema: {
        period: z.enum(['24h', 'month', 'year']),
        year: z.number().int().min(1900).max(2100).optional(),
        month: z.number().int().min(1).max(12).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ period, year, month, limit }) => {
      const now = new Date();
      const range =
        period === '24h'
          ? last24h(now)
          : period === 'month' && !year
            ? currentMonthRange(now)
            : monthRange(year ?? now.getUTCFullYear(), period === 'month' || month ? month : undefined);
      const { rows } = await db.query<{
        id: number; occurred_at: Date; location_name: string | null; fatalities: number | null; aircraft: string | null; n: number;
      }>(
        `SELECT a.id, a.occurred_at, a.location_name, a.fatalities, a.aircraft, count(r.id) AS n
           FROM accidents a JOIN articles r ON r.accident_id = a.id
          WHERE a.occurred_at >= $1 AND a.occurred_at < $2
          GROUP BY a.id ORDER BY a.occurred_at DESC LIMIT $3`,
        [range.from, range.to, limit ?? 20],
      );
      if (!rows.length) return text('No accidents in the period.');
      return text(
        rows
          .map(
            (r) =>
              `#${r.id} ${r.occurred_at.toISOString().slice(0, 10)} | ${r.location_name ?? '?'} | ` +
              `${r.aircraft ?? 'aircraft ?'} | fatalities ${r.fatalities ?? '?'} | ${r.n} source(s)`,
          )
          .join('\n'),
      );
    },
  );

  return server;
}
