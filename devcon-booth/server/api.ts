import { Hono } from "hono"
import type { Env } from "./env"

/**
 * The app's own server routes, under /api. Code here runs in the Worker, never
 * in the browser: keep secrets, management calls, and trusted logic here.
 * The browser calls these through the typed client in src/api.ts.
 */
export const api = new Hono<{ Bindings: Env }>().get("/status", (c) =>
  c.json({ ok: true })
)

export type Api = typeof api
