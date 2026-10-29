import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { dominoHosting, serverBoundary } from "@domino-sdk/relay/vite"

export default defineConfig(({ command }) => {
  // Serves the app the way `domino dev` and Domino hosting expect: the Worker in
  // the server environment, the preview origin's host, and the development
  // variables `domino dev` sets. Hosting binds a deployment's own values instead.
  const domino = dominoHosting({ command })

  return {
    plugins: [
      // Fails the build if browser code imports server/ or the management client.
      serverBoundary(),
      react(),
      tailwindcss(),
      cloudflare(domino.cloudflare),
    ],
    server: domino.server,
  }
})
