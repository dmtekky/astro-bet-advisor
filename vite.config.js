import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to our Express server in development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  // In production, we don't need the proxy as we'll use Vercel's rewrites
  ...(command === 'build' && {
    base: '/',
    server: {},
    preview: {
      port: 3000
    }
  })
}));
