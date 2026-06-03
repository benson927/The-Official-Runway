import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('gsap')) return 'vendor-gsap';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
})
