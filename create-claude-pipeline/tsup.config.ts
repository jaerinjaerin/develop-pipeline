import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { cli: 'src/index.ts' },
  format: ['cjs'],
  outDir: 'bin',
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
