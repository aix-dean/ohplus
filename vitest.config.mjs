/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    silent: true,
    logHeapUsage: false,
    clearMocks: true,
    coverage: {
      enabled: true,
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/utils.ts',
        'lib/types/proposal.ts',
        'components/blank-page-editor.tsx',
        'app/sales/proposals/[id]/page.tsx'
      ],
      exclude: ['**/*.test.js', '**/*.spec.js'],
    },
    testMatch: [
      '**/__tests__/**/*.?([mc])[jt]s?(x)',
      '**/?(*.)+(spec|test).?([mc])[jt]s?(x)',
      '**/*.test.js',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})