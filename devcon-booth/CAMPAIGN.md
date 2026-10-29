# Your campaign

Status: built from the owner's brief in an unattended run (2026-10-29). The brief below is treated as confirmed; gaps were filled conservatively and are listed under "Assumed in an unattended run". Staged on test data; not live.

## Original request

Devcon booth selfie quest: visitors upload a selfie at the booth for points; reused photos are caught. Photo booth look (direction C, Flash).

Full brief (agent prompt, 2026-10-29): A booth selfie quest for our Devcon booth. Visitors take a selfie at the Domino booth, upload it, and earn 100 points. Start from the unique-photo snippet, so a photo someone else already submitted is caught as reused and goes to staff instead of paying out. The photo must be a selfie or photo taken at a conference booth with a Domino banner or sign visible. Keep the app to one page: the quest, the photo upload, the result, and the visitor's points. The design section of that prompt (photo booth: sunny page, ink outlines with hard shadows, stickers, a Polaroid that develops after a camera flash) is implemented as specified in `src/styles.css` and `src/components/booth.tsx`.

## Brand direction

- Brand: Domino, at its Devcon booth. Wordmark and mark from https://domino.run/domino-light.svg, https://domino.run/domino-dark.svg and https://domino.run/domino-mark.svg (in `public/`).
- Look: photo booth. Sunny page #ffd23f, ink #1b1029, cream cards #fffdf7, grape #6d4aff, tangerine #ff8a3d, red #e5484d, mint #22c99a, pink #ff6fae (decoration only). Geist and Geist Mono. Dark mode follows the system.
- Voice: short, playful, direct ("Take a selfie at our booth.", "You're in").

## Campaign intent

- Goal: get Devcon visitors to the Domino booth and into a Domino account.
- Participants: Devcon attendees who visit the booth and open the app on their phone.
- Action: upload a selfie or booth photo with a Domino banner or sign visible.
- Verification (`quests/booth-selfie.quest.ts`, from the `unique-photo` snippet):
  1. `ctx.images.seen` checks for a photo another participant already submitted (perceptual hash distance ≤ 8). A match goes to staff review and does not pay out.
  2. Otherwise AI review against the criteria: pass → accepted; fail → rejected with the reason shown to the visitor; unclear → staff review.
- Reward: 100 points in the project's Points ledger, once per account.
- Journey: sign in → choose/take a photo → send → checking → completed (camera flash celebration), in review (with booth staff), or rejected ("Not quite", try another photo).

## Decisions and confirmation

No owner was available to confirm; the agent prompt is treated as the confirmed brief (unattended run).

### Assumed in an unattended run

- **Reward and limits:** 100 points, once per account (`completion: once()`), no budget cap or prize. Points are not redeemable for anything in this app.
- **Timing:** no start or end window. The quest runs until an operator pauses or archives it in Console.
- **Eligibility:** anyone who signs in with a method Domino offers for the project (email code, Google, X, Discord, Telegram). No allow-list or group.
- **Reuse threshold:** the snippet's default, hash distance 8 (catches resized or re-encoded copies; crops usually fall outside it). Operators can tune it in Console under the quest's settings.
- **Unclear AI results** go to staff review, as the snippet does, rather than being rejected.
- **Staff review** happens in Console's review queue by people with review permission. The app only shows "With booth staff" and updates when the review lands.
- **Sample content removed:** the starter's five sample quests (`welcome`, `how-domino-works`, `show-your-setup`, `meet-a-teammate`, `finish-the-tour`) were archived in the test environment, and `supportedInteractions` in relay.json is now `["photo"]`. The `/guide` and `/quests/$questId` pages were removed to keep the app to one page.
- **Large photos:** photos over 4.5 MB are resized in the browser (longest edge 2560 px, JPEG) before upload, to stay under Domino's 5 MB photo limit.
- **Selfie after reload:** a small thumbnail of the sent photo is kept in the visitor's browser (localStorage) so the Polaroid still shows it after a reload. On another device the Polaroid shows the Domino mark instead.
- **Dark mode details the brief left open:** chip and sticker borders stay ink; the primary button keeps its ink border and shadow.

### Open decisions

- Whether points lead to anything (merch, leaderboard). Nothing is promised in the app copy.
- Event dates, if the quest should open and close on its own.
