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
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;",
          "style-src 'self' 'unsafe-inline' https:;",
          "img-src 'self' data: https:;",
          "font-src 'self' data: https:;",
          "connect-src 'self' https:;",
          "frame-src 'self';",
          "media-src 'self' https:;"
        ].join(' '),
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      },
      proxy: {
        // Proxy API requests to our API server running on port 3001
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
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
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
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
