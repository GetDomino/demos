import { useExperience, useSignOut } from "@domino-sdk/relay/react"
import { Link } from "@tanstack/react-router"
import { footer, site } from "../content"

export function SiteHeader() {
  const experience = useExperience()
  const { mutate: signOut, isPending: busy } = useSignOut()

  return (
    <header className="flex items-center gap-3 pt-6">
      <Link to="/" aria-label={site.name} className="link shrink-0">
        <picture>
          <source
            srcSet="/domino-dark.svg"
            media="(prefers-color-scheme: dark)"
          />
          <img src="/domino-light.svg" alt="Domino" className="h-8 w-auto" />
        </picture>
      </Link>
      <span
        className="sticker rounded-lg bg-pink px-2.5 py-0.5 text-sm"
        style={{ transform: "rotate(-6deg)" }}
      >
        {site.event}
      </span>
      {experience.status === "ready" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => signOut()}
          className="link ml-auto font-bold underline underline-offset-4 disabled:opacity-50"
        >
          Sign out
        </button>
      )}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="flex items-start gap-3 border-t-2 border-line py-6 text-sm leading-snug">
      <img src="/domino-mark.svg" alt="" className="size-7 shrink-0" />
      <p>{footer.note}</p>
    </footer>
  )
}
