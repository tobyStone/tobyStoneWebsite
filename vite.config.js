import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        interactiveShip: resolve(__dirname, 'interactive-ship/index.html'),
      },
    },
  },
});
