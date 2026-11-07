#!/usr/bin/env node
import { createServer } from 'node:http';
import { createPool, migrate } from '@aobtd/core';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { NominatimGeocoder } from './geocode.js';
import { createMcpServer } from './mcp.js';
import type { ScanDeps } from './scanner.js';
import { startScheduler } from './scheduler.js';

// In stdio mode stdout is the MCP protocol channel: logs always go to stderr.
const log = (msg: string) => process.stderr.write(`[collector] ${new Date().toISOString()} ${msg}\n`);

async function main() {
  const db = createPool();
  await migrate(db, log);
  const deps: ScanDeps = { db, geocoder: new NominatimGeocoder(db), log };

  if (process.env.COLLECTOR_SCHEDULER !== 'off') {
    startScheduler(deps, Number(process.env.COLLECTOR_TICK_MS ?? 5 * 60_000));
    log('scheduler on (windows at 00h, 06h, 12h and 18h UTC)');
  }

  if (process.argv.includes('--http')) {
    // Stateless Streamable HTTP transport: one MCP server per request, no in-memory state.
    const port = Number(process.env.MCP_HTTP_PORT ?? 3333);
    createServer(async (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200).end('ok');
        return;
      }
      if (req.url !== '/mcp') {
        res.writeHead(404).end();
        return;
      }
      const server = createMcpServer(deps);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res);
    }).listen(port, () => log(`MCP HTTP em http://localhost:${port}/mcp`));
  } else {
    await createMcpServer(deps).connect(new StdioServerTransport());
    log('MCP stdio ready');
  }

  const shutdown = () => void db.end().finally(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  log(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
