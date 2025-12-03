import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Rimosso: GEMINI_API_KEY non deve essere nel bundle client
      // Le chiamate a Gemini vengono gestite tramite Netlify Functions
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
});
