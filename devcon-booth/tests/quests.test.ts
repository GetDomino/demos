import {
  expectAccept,
  expectReject,
  expectReview,
  runQuest,
} from "@domino-sdk/relay/testing"
import { expect, test } from "vitest"
import boothSelfie from "../quests/booth-selfie.quest"

// runQuest evaluates a quest the way Domino does when it runs it: the quest's
// settings and rewards, a frozen clock, and image check answers you fake.

const input = { photo: "evidence_selfie" }
const unseen = { matches: 0, closestDistance: null, firstSeenAt: null }

test("booth-selfie accepts a fresh photo the review passes", async () => {
  const run = await runQuest(boothSelfie, {
    input,
    facts: {
      images: {
        seen: unseen,
        review: { kind: "pass", reason: "Domino banner visible" },
      },
    },
  })

  expectAccept(run)
})

test("booth-selfie sends a photo someone else submitted to staff without AI review", async () => {
  let reviewed = false
  const run = await runQuest(boothSelfie, {
    input,
    facts: {
      images: {
        seen: { matches: 1, closestDistance: 2, firstSeenAt: 1 },
        review: () => {
          reviewed = true
          return { kind: "pass", reason: "" }
        },
      },
    },
  })

  expectReview(run, "This photo matches an earlier submission by someone else.")
  expect(reviewed).toBe(false)
})

test("booth-selfie sends unclear photos to staff and rejects failures", async () => {
  expectReview(
    await runQuest(boothSelfie, {
      input,
      facts: {
        images: { seen: unseen, review: { kind: "unclear", reason: "Too dark" } },
      },
    }),
    "Too dark"
  )
  expectReject(
    await runQuest(boothSelfie, {
      input,
      facts: {
        images: {
          seen: unseen,
          review: { kind: "fail", reason: "No Domino sign in the photo" },
        },
      },
    }),
    "No Domino sign in the photo"
  )
})
