import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx', 'src/components/**/__tests__/**/*.test.ts', 'src/components/**/__tests__/**/*.test.tsx', 'src/app/**/__tests__/**/*.test.ts', 'src/app/**/__tests__/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'swiper/css': path.resolve(__dirname, './src/__tests__/__mocks__/empty.ts'),
    },
  },
  css: {
    postcss: {},
  },
});
