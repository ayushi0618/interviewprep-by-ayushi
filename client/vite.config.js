import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: Vite on 5174 proxies /api to the Express server on 3002.
// Prod: Express serves the built dist/ folder itself, so no proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3002',
    },
  },
});
