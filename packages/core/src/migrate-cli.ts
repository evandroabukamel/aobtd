/** `npm run db:migrate`: applies the pending migrations to DATABASE_URL. Kept apart from migrate.ts so bundles that import @aobtd/core (Workers) never run it. */
import { createPool } from './db.js';
import { migrate } from './migrate.js';

const db = createPool();
migrate(db)
  .then((applied) => console.log(applied.length ? 'ok' : 'database already up to date'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
