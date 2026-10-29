import { hc } from "hono/client"
import type { Api } from "../server/api"

/**
 * Typed client for the app's own routes in server/api.ts. Types come from the
 * server code; nothing server-side reaches the browser bundle.
 */
export const api = hc<Api>("/api")
