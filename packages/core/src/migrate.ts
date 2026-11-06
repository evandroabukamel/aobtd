import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createPool, type Db } from './db.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations/', import.meta.url));

/** Aplica, em ordem e cada uma numa transação, as migrações ainda não aplicadas. */
export async function migrate(db: Db, log: (msg: string) => void = console.log): Promise<string[]> {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const { rows } = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied.push(file);
      log(`migração aplicada: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  return applied;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = createPool();
  migrate(db)
    .then((applied) => console.log(applied.length ? 'ok' : 'banco já atualizado'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => db.end());
}
