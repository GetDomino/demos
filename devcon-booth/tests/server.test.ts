import { afterEach, describe, expect, test, vi } from "vitest"
import server from "../server/index"
import type { Env } from "../server/env"

const context = {
  waitUntil() {},
  passThroughOnException() {},
  props: {},
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    ASSETS: {
      // Like the assets binding with html_handling "none": exact paths only.
      fetch: async (request: Request) =>
        new URL(request.url).pathname === "/index.html"
          ? new Response("<!doctype html>app", { status: 200 })
          : new Response("Not found", { status: 404 }),
    },
    ...overrides,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("server", () => {
  test("serves the app's own API", async () => {
    const response = await server.fetch(
      new Request("https://app.example/api/status"),
      env(),
      context
    )

    expect(await response.json()).toEqual({ ok: true })
  })

  test("page URLs fall back to index.html so the router can render them", async () => {
    const response = await server.fetch(
      new Request("https://app.example/some/page", {
        headers: { Accept: "text/html" },
      }),
      env(),
      context
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toContain("app")
  })

  test("missing files stay missing", async () => {
    const response = await server.fetch(
      new Request("https://app.example/missing.png"),
      env(),
      context
    )

    expect(response.status).toBe(404)
  })

  test("participant calls go through the Domino proxy, never the app", async () => {
    const upstream = vi.fn(async (request: Request) =>
      Response.json({ forwarded: new URL(request.url).pathname })
    )
    vi.stubGlobal("fetch", upstream)

    const response = await server.fetch(
      new Request("https://app.example/relay/v1/auth/session"),
      env({ DOMINO_LOCAL_API: "http://127.0.0.1:9000" }),
      context
    )

    expect(await response.json()).toEqual({ forwarded: "/v1/auth/session" })
  })
})
