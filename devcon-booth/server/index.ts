import { Hono, type ExecutionContext } from "hono"
import {
  handleHostedApp,
  hostedAppRequest,
} from "@domino-sdk/relay/portal-proxy"
import config from "../relay.json"
import { api } from "./api"
import type { Env } from "./env"

const app = new Hono<{ Bindings: Env }>()

// Domino's routes: the participant proxy (/relay/*) and `domino dev` controls.
app.use(async (c, next) => {
  const response = await handleHostedApp(c.req.raw, c.env, {
    apiUrl: config.apiUrl,
  })

  return response ?? next()
})

// The app's own server routes. Add more in server/api.ts.
app.route("/api", api)

// Everything else is the single-page app: files from dist/client, and
// index.html for any page URL so the router can take over. wrangler.jsonc
// serves files by exact path, as Domino hosting does, so this never redirects.
app.all("*", async (c) => {
  const response = await c.env.ASSETS.fetch(c.req.raw)

  if (
    response.status === 404 &&
    ["GET", "HEAD"].includes(c.req.method) &&
    c.req.header("Accept")?.includes("text/html")
  ) {
    return c.env.ASSETS.fetch(
      new Request(new URL("/index.html", c.req.url), c.req.raw)
    )
  }

  return response
})

export default {
  fetch: (request: Request, env: Env, context: ExecutionContext) =>
    app.fetch(hostedAppRequest(request, env), env, context),
}
