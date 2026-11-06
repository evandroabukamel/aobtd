import pg from 'pg';

// Retorna BIGINT/COUNT como number (os valores cabem com folga em 2^53).
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number.parseInt(v, 10));

export type Db = pg.Pool;

export function createPool(connectionString = process.env.DATABASE_URL): Db {
  if (!connectionString) throw new Error('DATABASE_URL não definida');
  return new pg.Pool({ connectionString, max: Number(process.env.PG_POOL_MAX ?? 10) });
}
