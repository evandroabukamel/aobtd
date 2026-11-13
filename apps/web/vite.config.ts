import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // shadcn/ui components import each other as `@/components/ui/...`.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // VITE_* links are read from the .env at the repository root, like the other settings.
  envDir: '../..',
  server: { proxy: { '/api': 'http://localhost:3000' } },
  build: {
    target: 'es2022',
    rollupOptions: {
      // Leaflet in a separate chunk: the panel shows up before the map finishes loading.
      output: { manualChunks: (id) => (/node_modules\/(leaflet|react-leaflet|@react-leaflet)\//.test(id) ? 'map' : undefined) },
    },
  },
});
