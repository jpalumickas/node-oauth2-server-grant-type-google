import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  sourcemap: true,
  deps: {
    neverBundle: ['ws'],
  },
  target: false,
  exports: true,
});
