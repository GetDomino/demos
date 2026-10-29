import { pointsLedger } from "../ledgers"
import {
  defineQuest,
  settings,
  manual,
  evidence,
  once,
  points,
  decision,
} from "@domino-sdk/relay/authoring"

// Adapted from the unique-photo snippet (docs/snippets/unique-photo.md):
// a photo another participant already submitted goes to booth staff instead
// of paying out; every other photo is judged against the criteria by AI.
export default defineQuest({
  key: "booth-selfie",
  title: "Take a selfie at the Domino booth",
  settings: settings.object({
    instructions: settings.text({
      label: "Instructions",
      default:
        "Find the Domino booth, take a selfie with our banner or sign in the shot, and upload it here. Photos someone else already submitted go to booth staff for a check instead of paying out.",
      multiline: true,
    }),
    criteria: settings.text({
      label: "What the photo must show",
      default:
        "A selfie or photo taken at a conference booth, with a Domino banner or sign visible in the picture.",
      minLength: 1,
    }),
    maxDistance: settings.integer({
      label: "Largest hash distance that counts as a reused photo (0–8)",
      default: 8,
      min: 0,
      max: 8,
    }),
    balance: settings.pointLedger({
      label: "Point ledger",
      default: pointsLedger,
    }),
    points: settings.integer({
      label: "Points awarded",
      default: 100,
      min: 0,
      max: 10000,
    }),
  }),
  presentation: ({ settings }) => ({ instructions: settings.instructions }),
  trigger: manual({ input: evidence.photo() }),
  completion: once(),
  review: () => ({ enabled: true }),
  rewards: ({ settings }) => [points(settings.balance, settings.points)],
  async evaluate(ctx) {
    const photo = { evidence: ctx.input.photo }
    const seen = await ctx.images.seen(photo, {
      maxDistance: ctx.settings.maxDistance,
    })

    // Another participant already submitted this picture, possibly resized or re-encoded.
    if (seen.matches > 0) {
      return decision.review({
        reason: "This photo matches an earlier submission by someone else.",
      })
    }

    const result = await ctx.images.review({
      images: [photo],
      criteria: ctx.settings.criteria,
    })

    if (result.kind === "unclear") {
      return decision.review({ reason: result.reason })
    }

    return result.kind === "pass"
      ? decision.accept()
      : decision.reject({ reason: result.reason })
  },
})
