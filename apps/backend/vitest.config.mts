import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Mirrors the Jest config in package.json (moduleNameMapper ^src/(.*)$ -> src/$1).
export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['tests/vitest-setup.mts'],
  },
});
