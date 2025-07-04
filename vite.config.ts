import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Explicitly define which env vars should be exposed to the client
  const clientEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      clientEnv[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    base: env.VITE_BASE_URL || '/',
    define: { ...clientEnv,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      global: {},
    },
    server: {
      host: '::',
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['@emotion/react', '@emotion/styled'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
        },
        preserveEntrySignatures: 'allow-extension',
      },
      chunkSizeWarningLimit: 2000,
      minify: mode === 'production' ? 'esbuild' : false,
      sourcemap: mode === 'development',
    },
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
      }),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@types': path.resolve(__dirname, './src/types'),
        'buffer': 'buffer/',
        'stream': 'stream-browserify',
        'util': 'util/',
        'path': 'path-browserify',
        'process': 'process/browser',
        'crypto': 'crypto-browserify',
        'https': 'https-browserify',
        'os': 'os-browserify/browser',
        'zlib': 'browserify-zlib',
        'vm': 'vm-browserify',
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.node'],
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
      },
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@emotion/react',
        '@emotion/styled',
        'date-fns',
        'lodash',
        'axios',
      ],
    },
    ssr: {
      noExternal: ['@astrodraw/astrochart'],
    },
  };
});
