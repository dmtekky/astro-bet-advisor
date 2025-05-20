import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      // Only import React when needed
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    })
  ],
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
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['@radix-ui/react-*', 'date-fns'],
        },
      },
    },
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
