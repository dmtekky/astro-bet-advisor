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
        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',
        
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',
        
        // XSS Protection (legacy browsers)
        'X-XSS-Protection': '1; mode=block',
        
        // Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        
        // Permissions Policy (formerly Feature Policy)
        'Permissions-Policy': [
          'accelerometer=()',
          'ambient-light-sensor=()',
          'autoplay=()',
          'camera=()',
          'display-capture=()',
          'document-domain=()',
          'encrypted-media=()',
          'fullscreen=()',
          'geolocation=()',
          'gyroscope=()',
          'magnetometer=()',
          'microphone=()',
          'midi=()',
          'payment=()',
          'picture-in-picture=()',
          'speaker=()',
          'sync-xhr=()',
          'usb=()',
          'vr=()',
          'xr-spatial-tracking=()'
        ].join(', '),
        
        // Content Security Policy
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.live/ https://vercel.com https://vercel.com/ https://va.vercel-scripts.com;",
          "style-src 'self' 'unsafe-inline' https:;",
          "img-src 'self' data: https: blob:;",
          "font-src 'self' data: https:;",
          "connect-src 'self' https: wss:;",
          "frame-src 'self' https://vercel.live https://vercel.com;",
          "media-src 'self' https:;",
          "object-src 'none';",
          "base-uri 'self';",
          "form-action 'self';",
          "frame-ancestors 'none';",
          "block-all-mixed-content;"
        ].join(' '),
        
        // HTTP Strict Transport Security
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        
        // X-Permitted-Cross-Domain-Policies
        'X-Permitted-Cross-Domain-Policies': 'none',
        
        // X-Download-Options
        'X-Download-Options': 'noopen',
      },
      proxy: {
        // Proxy API requests to our API server running on port 3001
        // Disabled in production to use Vercel serverless functions
        ...(process.env.NODE_ENV !== 'production' ? {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        } : {})
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
