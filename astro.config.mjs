import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  srcDir: './src',
  pages: './src/pages',
  integrations: [react()],
  // If your Vite config needs to remain separate, ensure it's being correctly loaded
  // or consider moving relevant parts here if they are Astro-specific.
  // For now, Astro will also pick up vite.config.ts by default.
  server: {
    port: 8080 // Ensuring consistency with your vite.config.ts port
  }
});
