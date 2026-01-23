import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/ui/',
  build: {
    outDir: '.ntli/site/static/ui',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      react: path.resolve('./node_modules/@netlify/sdk/node_modules/react'),
      'react-dom': path.resolve('./node_modules/@netlify/sdk/node_modules/react-dom'),
    },
  },
});
