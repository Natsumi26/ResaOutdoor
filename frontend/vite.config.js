import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Nécessaire pour Docker
    watch: {
      usePolling: true, // Active le polling pour Docker/Windows
      interval: 1000 // Vérifier les changements toutes les secondes
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
