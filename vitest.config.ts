import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@aobtd/core', replacement: fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)) },
      // shadcn/ui imports inside the web app (`@/components/ui/...`).
      { find: /^@\//, replacement: fileURLToPath(new URL('./apps/web/src/', import.meta.url)) },
    ],
  },
  test: {
    include: ['{apps,packages}/*/test/**/*.test.{ts,tsx}'],
    // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock; this file is a no-op elsewhere.
    setupFiles: ['./apps/web/test/setup.ts'],
    // Integration tests share the same database: they run sequentially.
    fileParallelism: false,
  },
});
