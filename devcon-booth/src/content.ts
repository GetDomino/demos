/*
 * Every word the app shows that doesn't come from Domino. Quest instructions
 * come from quests/booth-selfie.quest.ts through the API, and operators can
 * edit them in Console.
 */

import project from "./project.json"

export const site = {
  /** The project name from Console, written when the project was created. */
  name: project.name,
  event: "Devcon",
}

export const hero = {
  signedOut: "Take a selfie at our booth.",
  signedOutBody:
    "Get the Domino sign in the shot, upload it here, and the points are yours.",
  signedIn: "Take a selfie at the Domino booth",
}

export const signedOut = {
  title: "Sign in to start",
  body: "Your points stay with your account.",
}

export const quest = {
  /** Shown when Domino has no instructions for the quest. */
  instructions:
    "Find the Domino booth, take a selfie with our banner or sign in the shot, and upload it here. Photos someone else already submitted go to booth staff for a check instead of paying out.",
  send: "Send my selfie",
  sending: "Sending…",
  empty: "Take or choose a photo",
  change: "Change",
  checking: "Checking your photo",
  checkingNote: "This takes a few seconds.",
  approved: "You're in",
  approvedNote: "Your selfie checks out and the points are in your account.",
  review: "With booth staff",
  reviewNote:
    "Someone at the booth will look at your photo. This page updates by itself.",
  rejectedTitle: "Not quite",
  rejectedNext: "Try another photo.",
  unavailable: "The booth selfie isn't open right now. Check back soon.",
}

export const footer = {
  note: "Photos are checked by Domino. A photo someone else already sent goes to booth staff instead of earning points.",
}
