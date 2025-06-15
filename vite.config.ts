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
    },
    
    server: {
      host: "::",
      port: 8080,
      // Enable HMR with proper WebSocket connection
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 8080
      },
      proxy: {
        // Proxy API requests to our API server running on port 3001
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      // Ensure proper CORS headers for development
      cors: true,
      // Enable source maps in development
      sourcemap: true,
    },
    
    build: {
      sourcemap: true,
      // Ensure chunks are properly split and hashed
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Consistent hashing for better caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          // Ensure proper module resolution
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
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
        '@lib': path.resolve(__dirname, './src/lib')
      }
    },
  };
});
