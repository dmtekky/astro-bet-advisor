import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src')
      },
      {
        find: '@components',
        replacement: path.resolve(__dirname, './src/components')
      },
      {
        find: '@lib',
        replacement: path.resolve(__dirname, './src/lib')
      },
      {
        find: '@hooks',
        replacement: path.resolve(__dirname, './src/hooks')
      }
    ],
  },
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
          vendor: ['date-fns'],
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
