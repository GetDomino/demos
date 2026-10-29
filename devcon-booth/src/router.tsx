import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import { HomePage } from "./pages/home"
import { Layout, NotFound } from "./pages/layout"

// Every page of the app. Add a page: write it in src/pages/, then add a route here.
const root = createRootRoute({ component: Layout, notFoundComponent: NotFound })

const routeTree = root.addChildren([
  createRoute({ getParentRoute: () => root, path: "/", component: HomePage }),
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
})

// Registers the router's types, so <Link to="..."> and route params are checked.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
