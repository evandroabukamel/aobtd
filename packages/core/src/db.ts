import pg from 'pg';

// Returns BIGINT/COUNT as number (the values fit comfortably in 2^53).
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number.parseInt(v, 10));

export type Db = pg.Pool;

/** `max`: connections in the pool; a Cloudflare Worker uses 1 per request (connections cannot outlive it). */
export function createPool(connectionString = process.env.DATABASE_URL, max = Number(process.env.PG_POOL_MAX ?? 10)): Db {
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new pg.Pool({ connectionString, max });
}
