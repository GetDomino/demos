import { Link, Outlet } from "@tanstack/react-router"
import { SiteFooter, SiteHeader } from "../components/site-chrome"

/** One phone-width column, centered on wider screens. */
export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-5">
      <SiteHeader />
      <main className="flex-1 pt-6 pb-12">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

export function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="headline text-[34px]">Page not found</h1>
      <p>
        <Link to="/" className="link font-bold underline underline-offset-4">
          Back to the booth
        </Link>
      </p>
    </div>
  )
}
