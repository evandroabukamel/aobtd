import { currentMonthRange, last24h, monthRange, type Db } from '@aobtd/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { claimSource, formatSummary, loadSources, runDueScans, scanSource, type ScanDeps } from './scanner.js';
import { nextRun } from './schedule.js';

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const hhmm = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace('T', ' ') + 'Z' : 'nunca');

/**
 * Ferramentas MCP do coletor. As respostas são texto curto, uma linha por item,
 * para gastar poucos tokens no cliente que chamar o servidor.
 */
export function createMcpServer(deps: ScanDeps): McpServer {
  const server = new McpServer({ name: 'aobtd-collector', version: '0.1.0' });
  const { db } = deps;

  server.registerTool(
    'list_sources',
    {
      description: 'Lista as fontes monitoradas, a janela diária de cada uma (UTC) e o estado da última varredura.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      const now = new Date();
      const lines = (await loadSources(db)).map(
        (s) =>
          `${s.slug} | ${s.enabled ? 'ativa' : 'desligada'} | janela ${String(s.scan_slot * 6).padStart(2, '0')}h | ` +
          `última ${hhmm(s.last_scan_at)} (${s.last_status ?? '-'}) | próxima ${hhmm(nextRun(s.scan_slot, s.last_scan_at, now))}` +
          (s.last_error ? ` | erro: ${s.last_error}` : ''),
      );
      return text(lines.join('\n'));
    },
  );

  server.registerTool(
    'run_due_scans',
    {
      description:
        'Varre as fontes cuja janela diária já começou e que ainda não foram varridas neste período. Cada fonte é varrida no máximo uma vez por dia.',
    },
    async () => {
      const results = await runDueScans(deps);
      return text(results.length ? results.map(formatSummary).join('\n') : 'Nenhuma fonte pendente agora.');
    },
  );

  server.registerTool(
    'scan_source',
    {
      description:
        'Varre uma fonte específica. Sem force, respeita o limite de uma varredura por dia; force=true ignora o limite (uso manual).',
      inputSchema: { slug: z.string().describe('Identificador da fonte, ex.: "bbc"'), force: z.boolean().optional() },
    },
    async ({ slug, force }) => {
      const source = (await loadSources(db)).find((s) => s.slug === slug);
      if (!source) return { ...text(`Fonte "${slug}" não encontrada.`), isError: true };
      if (!(await claimSource(db, source, new Date(), force ?? false))) {
        return text(`${slug}: já varrida neste período (${hhmm(source.last_scan_at)}). Use force=true para repetir.`);
      }
      return text(formatSummary(await scanSource(deps, source)));
    },
  );

  server.registerTool(
    'query_accidents',
    {
      description: 'Lista acidentes gravados: últimas 24h, mês atual, ou um mês/ano específico.',
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
      if (!rows.length) return text('Nenhum acidente no período.');
      return text(
        rows
          .map(
            (r) =>
              `#${r.id} ${r.occurred_at.toISOString().slice(0, 10)} | ${r.location_name ?? '?'} | ` +
              `${r.aircraft ?? 'aeronave ?'} | vítimas ${r.fatalities ?? '?'} | ${r.n} fonte(s)`,
          )
          .join('\n'),
      );
    },
  );

  return server;
}
