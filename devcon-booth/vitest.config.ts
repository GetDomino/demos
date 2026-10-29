import { defineConfig } from "vitest/config"

// Tests run in Node without the Cloudflare plugin from vite.config.ts.
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
})
