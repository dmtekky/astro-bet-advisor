// vite.config.ts
import { defineConfig, loadEnv } from "file:///Users/dmtekk/Desktop/FMO1/astro-bet-advisor/node_modules/vite/dist/node/index.js";
import react from "file:///Users/dmtekk/Desktop/FMO1/astro-bet-advisor/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///Users/dmtekk/Desktop/FMO1/astro-bet-advisor/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/dmtekk/Desktop/FMO1/astro-bet-advisor";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clientEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("VITE_")) {
      clientEnv[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }
  return {
    // This ensures that the app works when served from a subdirectory
    base: env.VITE_BASE_URL || "/",
    define: {
      ...clientEnv,
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_KEY": JSON.stringify(env.VITE_SUPABASE_KEY)
    },
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // Proxy API requests to our API server running on port 3001
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true
        }
      }
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: path.resolve(__vite_injected_original_dirname, "index.html")
        },
        output: {
          // Ensure consistent hashing of asset names
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js"
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1e3
    },
    plugins: [
      react({
        jsxImportSource: "@emotion/react"
      }),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        "@components": path.resolve(__vite_injected_original_dirname, "./src/components"),
        "@lib": path.resolve(__vite_injected_original_dirname, "./src/lib")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZG10ZWtrL0Rlc2t0b3AvRk1PMS9hc3Ryby1iZXQtYWR2aXNvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2RtdGVray9EZXNrdG9wL0ZNTzEvYXN0cm8tYmV0LWFkdmlzb3Ivdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2RtdGVray9EZXNrdG9wL0ZNTzEvYXN0cm8tYmV0LWFkdmlzb3Ivdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5LlxuICAvLyBTZXQgdGhlIHRoaXJkIHBhcmFtZXRlciB0byAnJyB0byBsb2FkIGFsbCBlbnYgcmVnYXJkbGVzcyBvZiB0aGUgYFZJVEVfYCBwcmVmaXguXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBcbiAgLy8gRXhwbGljaXRseSBkZWZpbmUgd2hpY2ggZW52IHZhcnMgc2hvdWxkIGJlIGV4cG9zZWQgdG8gdGhlIGNsaWVudFxuICBjb25zdCBjbGllbnRFbnYgPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZW52KSkge1xuICAgIGlmIChrZXkuc3RhcnRzV2l0aCgnVklURV8nKSkge1xuICAgICAgY2xpZW50RW52W2BpbXBvcnQubWV0YS5lbnYuJHtrZXl9YF0gPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgYXBwIHdvcmtzIHdoZW4gc2VydmVkIGZyb20gYSBzdWJkaXJlY3RvcnlcbiAgICBiYXNlOiBlbnYuVklURV9CQVNFX1VSTCB8fCAnLycsXG4gICAgXG4gICAgZGVmaW5lOiB7XG4gICAgICAuLi5jbGllbnRFbnYsXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfU1VQQUJBU0VfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfU1VQQUJBU0VfVVJMKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9TVVBBQkFTRV9LRVkpLFxuICAgIH0sXG4gICAgXG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgLy8gUHJveHkgQVBJIHJlcXVlc3RzIHRvIG91ciBBUEkgc2VydmVyIHJ1bm5pbmcgb24gcG9ydCAzMDAxXG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIFxuICAgIGJ1aWxkOiB7XG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgbWFpbjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKSxcbiAgICAgICAgfSxcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLy8gRW5zdXJlIGNvbnNpc3RlbnQgaGFzaGluZyBvZiBhc3NldCBuYW1lc1xuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nLFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIC8vIEluY3JlYXNlIGNodW5rIHNpemUgd2FybmluZyBsaW1pdFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIH0sXG4gICAgXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3Qoe1xuICAgICAgICBqc3hJbXBvcnRTb3VyY2U6ICdAZW1vdGlvbi9yZWFjdCcsXG4gICAgICB9KSxcbiAgICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgXS5maWx0ZXIoQm9vbGVhbiksXG4gICAgXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgICAgJ0Bjb21wb25lbnRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2NvbXBvbmVudHMnKSxcbiAgICAgICAgJ0BsaWInOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvbGliJylcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNULFNBQVMsY0FBYyxlQUFlO0FBQzVWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFHeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRzNDLFFBQU0sWUFBWSxDQUFDO0FBQ25CLGFBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxPQUFPLFFBQVEsR0FBRyxHQUFHO0FBQzlDLFFBQUksSUFBSSxXQUFXLE9BQU8sR0FBRztBQUMzQixnQkFBVSxtQkFBbUIsR0FBRyxFQUFFLElBQUksS0FBSyxVQUFVLEtBQUs7QUFBQSxJQUM1RDtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUE7QUFBQSxJQUVMLE1BQU0sSUFBSSxpQkFBaUI7QUFBQSxJQUUzQixRQUFRO0FBQUEsTUFDTixHQUFHO0FBQUEsTUFDSCxxQ0FBcUMsS0FBSyxVQUFVLElBQUksaUJBQWlCO0FBQUEsTUFDekUscUNBQXFDLEtBQUssVUFBVSxJQUFJLGlCQUFpQjtBQUFBLElBQzNFO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUE7QUFBQSxRQUVMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsUUFDYixPQUFPO0FBQUEsVUFDTCxNQUFNLEtBQUssUUFBUSxrQ0FBVyxZQUFZO0FBQUEsUUFDNUM7QUFBQSxRQUNBLFFBQVE7QUFBQTtBQUFBLFVBRU4sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsSUFFQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsUUFDSixpQkFBaUI7QUFBQSxNQUNuQixDQUFDO0FBQUEsTUFDRCxTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUM1QyxFQUFFLE9BQU8sT0FBTztBQUFBLElBRWhCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxRQUNwQyxlQUFlLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxRQUN6RCxRQUFRLEtBQUssUUFBUSxrQ0FBVyxXQUFXO0FBQUEsTUFDN0M7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
