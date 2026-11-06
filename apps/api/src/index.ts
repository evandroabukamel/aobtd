import { createPool, migrate } from '@aobtd/core';
import { buildApp } from './app.js';

const db = createPool();
await migrate(db);
const app = buildApp({ db, webDist: process.env.WEB_DIST });

const close = async () => {
  await app.close();
  await db.end();
  process.exit(0);
};
process.on('SIGINT', close);
process.on('SIGTERM', close);

await app.listen({ port: Number(process.env.API_PORT ?? 3000), host: process.env.API_HOST ?? '0.0.0.0' });
