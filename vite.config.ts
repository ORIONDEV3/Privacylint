import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Set DISABLE_HMR=true in preview environments that copy files instead of watching them.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching in that mode to avoid duplicate reloads.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
