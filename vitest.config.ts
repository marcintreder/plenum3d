import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/test/unit/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    alias: {
      '@react-three/fiber': '/Users/samwise/factory-projects/sculpt3d/src/test/__mocks__/r3f.js',
      '@react-three/drei': '/Users/samwise/factory-projects/sculpt3d/src/test/__mocks__/drei.js',
    },
  },
});
