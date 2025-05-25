import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // This ensures that the app works when served from a subdirectory
    base: env.VITE_BASE_URL || '/',
    
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // '/api': {
        //   target: 'http://localhost:3001',
        //   changeOrigin: true,
        //   configure: (proxy, options) => {
        //     proxy.on('error', (err, req, res) => {
        //       console.log('Vite Proxy Error:', err);
        //     });
        //     proxy.on('proxyReq', (proxyReq, req, res) => {
        //       console.log('Vite Proxying request:', req.method, req.url, 'to', options.target + proxyReq.path);
        //     });
        //     proxy.on('proxyRes', (proxyRes, req, res) => {
        //       console.log('Vite Received response from target:', proxyRes.statusCode, req.url);
        //     });
        //   }
        // }
      }
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
      // react({
        // jsxImportSource: '@emotion/react',
      // }),
      // mode === 'development' && componentTagger(),
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
