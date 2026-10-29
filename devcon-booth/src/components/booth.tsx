import { useEffect, useMemo, useState, type CSSProperties } from "react"
import type { QuestView } from "@domino-sdk/relay"
import {
  canSubmit,
  questStatus,
  questStatusText,
  useBalances,
  useQuest,
} from "@domino-sdk/relay/react"
import { quest as copy } from "../content"
import { Notice } from "./notice"
import { preparePhoto, thumbnail } from "./photo"

type Phase =
  | "ready"
  | "checking"
  | "review"
  | "rejected"
  | "retryable"
  | "done"
  | "other"

const CHIPS: Record<Exclude<Phase, "other">, { label: string; look: string }> =
  {
    ready: { label: "Ready", look: "bg-grape text-white" },
    checking: { label: "Checking", look: "bg-tangerine text-ink" },
    review: { label: "In review", look: "bg-sunny text-ink" },
    rejected: { label: "Try again", look: "bg-red text-white" },
    retryable: { label: "Try again", look: "bg-red text-white" },
    done: { label: "Completed", look: "bg-mint text-ink" },
  }

/**
 * The booth's one quest: the first photo quest Domino lists for this visitor
 * that is still running. Archived quests stay in the list for their history.
 */
export function Booth({ quests }: { quests: QuestView[] }) {
  const photos = quests.filter((q) => q.interaction === "photo")
  const view =
    photos.find((q) => q.lifecycle === "active") ??
    photos.find((q) => q.lifecycle !== "archived")

  if (!view) {
    return (
      <>
        <Scores phase="other" label="Closed" />
        <section className="card p-5">
          <p className="font-medium">{copy.unavailable}</p>
        </section>
      </>
    )
  }

  // Remount when the quest changes so no draft leaks between quests.
  return <SelfieQuest key={view.quest} observed={view} />
}

function SelfieQuest({ observed }: { observed: QuestView }) {
  const quest = useQuest(observed)
  const { view } = quest
  const status = questStatus(view)
  const [file, setFile] = useState<File | null>(null)
  // The attempt that was current when the visitor pressed send: until Domino
  // reports a newer one, the photo is still on its way.
  const [sentFrom, setSentFrom] = useState<string | null | undefined>()
  const [sentPhoto, setSentPhoto] = useState(() => storage.get(photoKey(view)))
  const reward =
    view.rewards.find((r) => r.kind === "points")?.amount ?? DEFAULT_REWARD

  useEffect(() => {
    if (quest.draft?.kind === "photo") {
      setFile(
        new File([quest.draft.file], "photo", { type: quest.draft.file.type })
      )
    }
  }, [quest.draft])

  const attemptId = view.attempt?.id ?? null
  useEffect(() => {
    if (sentFrom !== undefined && (attemptId !== sentFrom || quest.error)) {
      setSentFrom(undefined)
    }
  }, [attemptId, sentFrom, quest.error])

  let phase: Phase = phaseOf(status.code)
  if (quest.isPending || (sentFrom !== undefined && attemptId === sentFrom)) {
    phase = "checking"
  }

  // A rejection clears the Polaroid for the next try. The sent photo stays
  // saved: an operator can still accept the rejected attempt.
  useEffect(() => {
    if (phase === "rejected") {
      setFile(null)
    }
    // Only on reaching a rejection, not on every poll of the same attempt.
  }, [phase, attemptId])

  const accepted = phase === "done" ? (attemptId ?? "completed") : null
  const celebrating = useCelebration(view, accepted)

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  )
  useEffect(
    () => () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    },
    [preview]
  )

  async function send() {
    if (!file) {
      return
    }
    const upload = await preparePhoto(file)
    const thumb = await thumbnail(file)
    if (thumb) {
      storage.set(photoKey(view), thumb)
    }
    setSentPhoto(thumb ?? preview)
    setSentFrom(attemptId)
    await quest.submit({ kind: "photo", file: upload })
  }

  const busy = quest.isPending
  const canPick =
    (phase === "ready" || phase === "rejected") &&
    !quest.retired &&
    quest.saved !== "interrupted"
  const reason = status.reason || view.attempt?.reason
  const text = questStatusText(view)

  return (
    <>
      {celebrating && <div className="flash" aria-hidden="true" />}
      <Scores
        phase={phase}
        label={text.label}
        pill={celebrating ? reward : null}
      />

      <section aria-labelledby="quest-title" className="card space-y-5 p-5">
        <h2 id="quest-title" className="sr-only">
          {view.title}
        </h2>
        <p className="leading-snug font-medium">
          {view.presentation.instructions ?? copy.instructions}
        </p>

        {phase === "rejected" && (
          <div
            role="alert"
            className="rounded-[14px] border-2 border-red bg-card p-4"
          >
            <p className="headline text-[22px] text-red">
              {copy.rejectedTitle}
            </p>
            {reason && <p className="mt-2 font-medium">{reason}</p>}
            <p className="mt-1 font-medium">{copy.rejectedNext}</p>
          </div>
        )}

        {quest.notice === "quest-updated" && (
          <Notice>
            This quest changed while you were working on it. Check the latest
            details, then send again. We kept your photo.
          </Notice>
        )}

        <div className="py-2">
          <Polaroid
            phase={canPick ? (file ? "chosen" : "empty") : phase}
            src={canPick ? preview : (sentPhoto ?? preview)}
            celebrating={celebrating}
            reward={reward}
            disabled={busy}
            onPick={setFile}
          />
        </div>

        {phase === "checking" && (
          <p className="text-center font-medium">{copy.checkingNote}</p>
        )}
        {phase === "review" && (
          <p className="text-center font-medium">{copy.reviewNote}</p>
        )}
        {phase === "done" && (
          <p className="text-center font-medium">{copy.approvedNote}</p>
        )}
        {phase === "other" && text.detail && (
          <p className="text-center font-medium">{text.detail}</p>
        )}

        {quest.retired ? (
          <div className="space-y-3">
            <Notice>
              This saved photo was retired during an update. Start a new
              submission; nothing is sent until you press send again.
            </Notice>
            <button
              type="button"
              className="btn-primary"
              onClick={quest.restart}
              disabled={busy}
            >
              Start a new submission
            </button>
          </div>
        ) : quest.saved === "interrupted" ? (
          <div className="space-y-3">
            <Notice>
              Your last photo didn't finish sending. It's saved on this device.
            </Notice>
            <button
              type="button"
              className="btn-primary"
              onClick={quest.resume}
              disabled={busy}
            >
              {busy ? copy.sending : "Finish sending it"}
            </button>
          </div>
        ) : (
          <>
            {quest.saved === "outdated" &&
              canPick &&
              quest.notice !== "quest-updated" && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={quest.resume}
                  disabled={busy}
                >
                  Restore my unsent photo
                </button>
              )}
            {canPick && (
              <button
                type="button"
                className="btn-primary"
                disabled={busy || !file || !canSubmit(view)}
                onClick={() => void send()}
              >
                {busy ? copy.sending : copy.send}
              </button>
            )}
            {phase === "retryable" && !quest.startingFresh && (
              <button
                type="button"
                className="btn-primary"
                onClick={quest.retry}
                disabled={busy}
              >
                {busy ? "Trying…" : "Check my photo again"}
              </button>
            )}
            {view.attempt?.status === "failed" && !quest.startingFresh && (
              <button
                type="button"
                className="btn-secondary"
                onClick={quest.restart}
                disabled={busy}
              >
                Start a new submission
              </button>
            )}
          </>
        )}

        {phase === "rejected" && status.code === "retry-cooldown" && text.detail && (
          <p className="font-medium">{text.detail}</p>
        )}
        {quest.error && <Notice tone="alert">{quest.error.message}</Notice>}
      </section>
    </>
  )
}

function phaseOf(code: string): Phase {
  switch (code) {
    case "ready":
      return "ready"
    case "checking":
    case "evaluator-deferred":
    case "evaluator-progress":
      return "checking"
    case "in-review":
      return "review"
    case "rejected":
    case "retry-cooldown":
      return "rejected"
    case "retryable":
      return "retryable"
    case "completed":
      return "done"
    default:
      return "other"
  }
}

/**
 * True while the celebration plays: once per accepted attempt, remembered in
 * localStorage so a reload shows the settled state.
 */
function useCelebration(view: QuestView, accepted: string | null) {
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    if (!accepted) {
      return
    }
    const key = `booth-selfie:celebrated:${view.quest}:${accepted}`
    if (storage.get(key)) {
      return
    }
    storage.set(key, "1")
    setCelebrating(true)
  }, [accepted, view.quest])

  useEffect(() => {
    if (!celebrating) {
      return
    }
    const timer = setTimeout(() => setCelebrating(false), CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [celebrating])

  return celebrating
}

const DEFAULT_REWARD = 100
const CELEBRATION_MS = 3800

function Scores({
  phase,
  label,
  pill = null,
}: {
  phase: Phase
  label: string
  pill?: number | null
}) {
  const balances = useBalances()
  const items = balances.data?.items ?? []
  const points = (
    items.find((item) => item.ledger.key === "points") ?? items[0]
  )?.balance
  const chip = phase === "other" ? { label, look: "bg-grape text-white" } : CHIPS[phase]

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
      <section
        aria-label="Your points"
        className="card px-4 pt-3 pb-2"
        style={{
          background: "var(--score-bg)",
          borderColor: "var(--score-line)",
          color: "var(--score-fg)",
        }}
      >
        <p className="label-caps opacity-85">Points</p>
        <p
          className="font-mono text-[44px] leading-[1.15] font-bold tabular-nums"
          aria-live="polite"
        >
          {points ?? (balances.status === "loading" ? "…" : 0)}
        </p>
        {pill !== null && (
          <span
            className="pop chip absolute -top-3.5 right-3 bg-mint text-ink"
            style={{ "--delay": "1500ms" } as CSSProperties}
          >
            +{pill}
          </span>
        )}
      </section>
      <section aria-label="Status" className="card flex flex-col gap-2 p-3">
        <p className="label-caps">Status</p>
        <p>
          <span className={`chip ${chip.look}`}>{chip.label}</span>
        </p>
      </section>
    </div>
  )
}

type PolaroidPhase = Phase | "empty" | "chosen"

function Polaroid({
  phase,
  src,
  celebrating,
  reward,
  disabled,
  onPick,
}: {
  phase: PolaroidPhase
  src: string | null
  celebrating: boolean
  reward: number
  disabled: boolean
  onPick: (file: File | null) => void
}) {
  const picking = phase === "empty" || phase === "chosen"
  const done = phase === "done"
  const tilt = done ? "-3deg" : "-2deg"
  const className = `polaroid ${picking ? "polaroid-pick" : ""} ${done && celebrating ? "drop" : ""}`
  const style = { "--tilt": tilt } as CSSProperties

  const body = (
    <>
      <div
        className={`polaroid-photo ${phase === "checking" ? "is-checking" : ""} ${done && celebrating ? "develop" : ""}`}
      >
        {src && phase !== "empty" ? (
          <img src={src} alt={picking ? "Your selected photo" : "Your selfie"} />
        ) : (
          <span className="absolute inset-0 grid place-items-center">
            {picking ? (
              <span className="grid size-[68px] place-items-center rounded-full border-2 border-ink bg-grape text-white shadow-[3px_3px_0_var(--ink)]">
                <CameraIcon />
              </span>
            ) : (
              <img src="/domino-mark.svg" alt="" className="size-16 opacity-40" />
            )}
          </span>
        )}
      </div>
      <p className="polaroid-caption" aria-live="polite">
        {phase === "checking" && <span className="spinner" aria-hidden="true" />}
        <span>{captionFor(phase)}</span>
      </p>
      {done && (
        <div
          className={`sticker-row ${celebrating ? "" : "[animation:none]"}`}
          style={{ "--row-delay": "1450ms" } as CSSProperties}
        >
          <div className="flex items-center justify-center gap-3 pb-4">
            <Starburst reward={reward} animate={celebrating} />
            <span
              className={`sticker rounded-full bg-mint px-3.5 py-1.5 text-[15px] ${celebrating ? "slap" : ""}`}
              style={
                {
                  transform: "rotate(5deg)",
                  "--rot": "5deg",
                  "--delay": "1850ms",
                } as CSSProperties
              }
            >
              <CheckIcon />
              Verified
            </span>
          </div>
        </div>
      )}
      {phase === "review" && (
        <span
          className="sticker slap absolute -top-3.5 -right-3 rounded-lg bg-sunny px-3 py-1 text-sm"
          style={{ transform: "rotate(8deg)", "--rot": "8deg" } as CSSProperties}
        >
          With staff
        </span>
      )}
    </>
  )

  if (!picking) {
    return (
      <div className={className} style={style}>
        {body}
      </div>
    )
  }

  return (
    <label className={className} style={style}>
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png"
        className="sr-only"
        disabled={disabled}
        aria-label={phase === "empty" ? copy.empty : "Change photo"}
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
      {body}
    </label>
  )
}

function captionFor(phase: PolaroidPhase) {
  switch (phase) {
    case "empty":
      return copy.empty
    case "chosen":
      return copy.change
    case "checking":
      return copy.checking
    case "review":
      return copy.review
    case "done":
      return copy.approved
    case "retryable":
      return "The check didn't run"
    default:
      return ""
  }
}

function Starburst({ reward, animate }: { reward: number; animate: boolean }) {
  const points = Array.from({ length: 28 }, (_, i) => {
    const r = i % 2 === 0 ? 48 : 39
    const a = (Math.PI * i) / 14
    return `${50 + r * Math.sin(a)},${50 - r * Math.cos(a)}`
  }).join(" ")

  return (
    <span
      className={`relative grid size-[96px] shrink-0 place-items-center text-ink ${animate ? "slap" : ""}`}
      style={
        {
          transform: "rotate(-8deg)",
          "--rot": "-8deg",
          "--delay": "1650ms",
        } as CSSProperties
      }
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
        <polygon
          points={points}
          fill="var(--sunny)"
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative text-center leading-none font-extrabold">
        <span className="block text-[22px] tracking-tight">+{reward}</span>
        <span className="block text-[12px]">points</span>
      </span>
    </span>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-1 size-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

const photoKey = (view: QuestView) => `booth-selfie:photo:${view.quest}`

/** localStorage that never throws: private modes and full storage just forget. */
const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Remembering is a nicety; the page works without it.
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      // As above.
    }
  },
}
