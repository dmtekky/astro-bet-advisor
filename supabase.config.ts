import { defineConfig } from 'supabase';

export default defineConfig({
  projectRef: 'your-project-ref',
  api: {
    runtime: 'deno',
    version: '1.0.0',
    entrypoints: {
      'update-ephemeris': './functions/update-ephemeris/index.ts'
    }
  },
  edge: {
    functions: {
      'update-ephemeris': {
        runtime: 'deno',
        memory: 128,
        timeout: 10,
        environment: {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_KEY: process.env.VITE_SUPABASE_KEY
        }
      }
    }
  }
});
