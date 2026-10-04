import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Next resolves the tsconfig `@/*` path itself; Vitest does not, so the alias is restated here.
// Keep it in step with tsconfig.json.
//
// Next loads .env.local for the app; Vitest does not, so the server module's Supabase
// settings are loaded here. Integration tests run against the real local Supabase
// (`bun run db:start` first), never a mock.
export default defineConfig(({ mode }) => ({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    env: loadEnv(mode, process.cwd(), ''),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
