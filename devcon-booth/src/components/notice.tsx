import type { ReactNode } from "react"

/** An inline message. `alert` interrupts screen readers; `info` waits. */
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "alert"
  children: ReactNode
}) {
  return (
    <p
      role={tone === "alert" ? "alert" : "status"}
      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium ${
        tone === "alert" ? "border-red text-text" : "border-line text-text"
      }`}
    >
      {children}
    </p>
  )
}
