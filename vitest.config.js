import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['three'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: ['node_modules', 'dist', 'src/test/e2e.test.js', 'src/test/fix_verification.test.js', 'e2e/**/*', 'tests/e2e/**/*'],
    deps: {
      inline: ['three-mesh-bvh', 'three-bvh-csg'],
    },
  },
});
