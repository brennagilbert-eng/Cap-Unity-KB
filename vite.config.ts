import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Match Express `PORT` (e.g. `PORT=3002 npm run dev`) or set `API_PORT` for the proxy target only. */
const apiPort = process.env.API_PORT || process.env.PORT || '3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
