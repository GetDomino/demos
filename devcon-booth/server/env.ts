import type { HostedAppEnv } from "@domino-sdk/relay/portal-proxy"
import type { HostedManagementEnv } from "@domino-sdk/relay/server"

/**
 * Bindings the Worker receives. Domino sets the DOMINO_* ones: the participant
 * proxy's settings, and a management key scoped to this project for
 * `hostedManagementClient(env)`. Add your own variables and secrets here.
 * KV and SQL stores from relay.json `app.storage` are typed with
 * `import type { D1Database, KVNamespace } from "@cloudflare/workers-types/index.ts"`:
 * https://console.domino.run/docs/build/storage
 */
export interface Env extends HostedAppEnv, HostedManagementEnv {
  ASSETS: { fetch(request: Request): Promise<Response> }
}
