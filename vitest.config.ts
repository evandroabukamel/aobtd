import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@aobtd/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)) },
  },
  test: {
    include: ['{apps,packages}/*/test/**/*.test.ts'],
    // Testes de integração compartilham o mesmo banco: rodam em sequência.
    fileParallelism: false,
  },
});
