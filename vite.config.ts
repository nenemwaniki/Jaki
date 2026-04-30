import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, host: true },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        arthur: resolve(__dirname, 'arthur.html'),
        jaki:   resolve(__dirname, 'jaki.html'),
      },
    },
  },
});
