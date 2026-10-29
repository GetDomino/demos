import { useState } from "react"
import { useSignInOptions } from "@domino-sdk/relay/react"
import { signedOut } from "../content"
import { Notice } from "./notice"

/**
 * Every sign-in method the project configured: an email code, OAuth, Telegram
 * and installed wallets. To offer Cosmos wallets, pass the app's chains:
 * `useSignInOptions({ cosmos: [{ chainId: "cosmoshub-4" }] })`.
 */
export function SignIn() {
  const signIn = useSignInOptions()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const options = signIn.options ?? []
  const emailOption = options.find((option) => option.kind === "email")
  // Every sign-in provider, Telegram included: `options` keeps SDK 1.x's closed provider list.
  const buttons = [
    ...(signIn.signInProviders ?? []),
    ...options.filter((option) => option.kind === "wallet"),
  ]
  const hint = signIn.unavailable.find(
    (entry) => entry.reason === "no-wallet-installed"
  )
  // For you, in development only: a method the project takes that this app leaves out.
  const developerNote = import.meta.env.DEV
    ? signIn.unavailable.find(
        (entry) =>
          entry.reason === "cosmos-chains-missing" ||
          entry.reason === "cosmos-chains-invalid"
      )
    : undefined

  return (
    <section aria-labelledby="sign-in-title" className="card space-y-4 p-5">
      <Smiley />
      <div>
        <h2 id="sign-in-title" className="headline text-[26px]">
          {signedOut.title}
        </h2>
        <p className="mt-2">{signedOut.body}</p>
      </div>

      {emailOption && !signIn.codeSent && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void emailOption.sendCode(email)
          }}
        >
          <label className="block space-y-1.5 text-sm font-bold">
            <span>Email</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="field font-normal"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={signIn.isPending}
          >
            {signIn.isPending ? "Sending…" : "Email me a sign-in code"}
          </button>
        </form>
      )}

      {emailOption && signIn.codeSent && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void emailOption.verifyCode(code)
          }}
        >
          <label className="block space-y-1.5 text-sm font-bold">
            <span>Code sent to {email}</span>
            <input
              required
              autoFocus
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="field font-mono font-normal tracking-widest"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={signIn.isPending}
          >
            {signIn.isPending ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={signIn.isPending}
            onClick={() => {
              setCode("")
              signIn.startOver()
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      {!signIn.codeSent && buttons.length > 0 && (
        <div className="space-y-2.5">
          {buttons.map((option) => (
            <button
              key={option.id}
              type="button"
              className="btn-secondary"
              disabled={signIn.isPending}
              onClick={() => void option.start()}
            >
              Continue with {option.label}
            </button>
          ))}
        </div>
      )}

      {!signIn.codeSent && hint && <p className="text-sm">{hint.message}</p>}

      {developerNote && (
        <Notice>
          {developerNote.message} The chains go in useSignInOptions() in
          src/components/sign-in.tsx; see AGENTS.md.
        </Notice>
      )}
      {signIn.options?.length === 0 &&
        !signIn.signInProviders?.length &&
        !hint &&
        !developerNote && (
          <Notice>
            {import.meta.env.DEV
              ? "This project has no sign-in method on. Enable wallet sign-in in Console under Settings → Sign-in, or ask Domino to configure a sign-in provider or email."
              : "Sign-in isn't available here yet. Check back soon."}
          </Notice>
        )}
      {signIn.error && <Notice tone="alert">{signIn.error.message}</Notice>}
    </section>
  )
}

/** The pink smiley sticker on the card's top-right corner. */
function Smiley() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 56 56"
      className="absolute -top-5 -right-2.5 size-14"
      style={{ transform: "rotate(12deg)" }}
    >
      <circle cx="28" cy="28" r="25" fill="var(--pink)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="20" cy="23" r="3.2" fill="var(--ink)" />
      <circle cx="36" cy="23" r="3.2" fill="var(--ink)" />
      <path
        d="M17 32c3 6.5 19 6.5 22 0"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
