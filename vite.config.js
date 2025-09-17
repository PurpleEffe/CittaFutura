import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        houses: path.resolve(__dirname, 'houses.html'),
        book: path.resolve(__dirname, 'book.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        privacy: path.resolve(__dirname, 'privacy.html'),
      },
    },
  },
});
