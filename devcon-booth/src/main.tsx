import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RelayProvider } from "@domino-sdk/relay/react"
import { RouterProvider } from "@tanstack/react-router"
import { site } from "./content"
import { router } from "./router"
import "./styles.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Missing #root in index.html")
}

document.title = site.name

// RelayProvider talks to Domino through /relay, the participant proxy in
// server/index.ts, and keeps one quest observer for the whole app.
createRoot(root).render(
  <StrictMode>
    <RelayProvider>
      <RouterProvider router={router} />
    </RelayProvider>
  </StrictMode>
)
