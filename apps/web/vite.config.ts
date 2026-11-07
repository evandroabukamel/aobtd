import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
  build: {
    target: 'es2022',
    rollupOptions: {
      // Leaflet in a separate chunk: the panel shows up before the map finishes loading.
      output: { manualChunks: (id) => (/node_modules\/(leaflet|react-leaflet|@react-leaflet)\//.test(id) ? 'map' : undefined) },
    },
  },
});
