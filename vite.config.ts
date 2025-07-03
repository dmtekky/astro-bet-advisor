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
    // This ensures that the app works when served from a subdirectory
    base: env.VITE_BASE_URL || '/',
    
    define: {
      ...clientEnv,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      global: {}
    },
    
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy API requests to our API server running on port 3001
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Ensure consistent hashing of asset names
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          // This helps with code splitting
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['@emotion/react', '@emotion/styled'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
        },
        // Fix for "The requested module does not provide an export named" errors
        preserveEntrySignatures: 'allow-extension',
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 2000,
      // Enable minification for production
      minify: mode === 'production' ? 'esbuild' : false,
      // Disable source maps in production for smaller bundle size
      sourcemap: mode === 'development',
    },
    
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        dev: mode === 'development',
      }),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
        { find: '@lib', replacement: path.resolve(__dirname, 'src/lib') },
        { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks') },
        { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
        // Polyfills for Node.js built-ins
        { find: 'buffer', replacement: 'buffer/' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'util', replacement: 'util/' },
        { find: 'path', replacement: 'path-browserify' },
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'http', replacement: 'stream-http' },
        { find: 'https', replacement: 'https-browserify' },
        { find: 'os', replacement: 'os-browserify/browser' },
        { find: 'zlib', replacement: 'browserify-zlib' },
        { find: 'vm', replacement: 'vm-browserify' },
      ],
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
  };
});
