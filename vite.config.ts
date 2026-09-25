/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'

const NODE_TESTS = [
  'src/app/server/**/*.test.ts',
  'src/features/*/model/**/*.test.ts',
  'src/shared/money/**/*.test.ts',
  'src/shared/http/**/*.test.ts',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    // The API (src/app/server/main.ts) runs next to Vite in `npm run dev`.
    proxy: { '/api': 'http://127.0.0.1:5181' },
  },
  test: {
    silent: 'passed-only',
    unstubEnvs: true,
    // The API tests need Node (SQLite, node:*) and pure logic runs there too;
    // anything touching the DOM runs in Chromium.
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: NODE_TESTS,
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: NODE_TESTS,
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    coverage: {
      // include: ['src/**/*.{js,jsx,ts,tsx}'], // Uncomment to expand the report to all src/**/* so untested modules appear as 0% coverage.
      exclude: [
        'src/components/ui/**',
        'src/routeTree.gen.ts',
        'src/test-utils/**',
        'src/routes/**',
      ],
    },
  },
})
