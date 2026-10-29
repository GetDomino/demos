# Campaign editing

<!-- domino:instructions:start -->
## Domino guidance

Before starting or resuming Domino work, read [the installed CLI's Domino skill](node_modules/@domino-sdk/relay-cli/cli/skills/domino/SKILL.md) and follow its relevant references, including the source and release workflow for hosted projects. Resolve relative references from the bundled skill's directory.

If the skill is missing, install this project's dependencies using its declared package manager and lockfile first. Use the project-local CLI. Re-read the skill after upgrading the CLI. Keep project-specific conventions in this file; shared Domino instructions come from the installed package.
<!-- domino:instructions:end -->

Read CAMPAIGN.md for the owner's intent. Follow the intake, discovery, and confirmation procedure in `node_modules/@domino-sdk/relay-cli/cli/skills/domino/SKILL.md`: ask for missing brand and campaign basics and wait for answers before research or design, then propose the direction and wait for confirmation before implementation. Reuse saved confirmation in later sessions.

For Domino setup, quest authoring, participant integration, or preview publication, read `node_modules/@domino-sdk/relay-cli/cli/skills/domino/SKILL.md` and its relevant reference. Run `pnpm exec domino doctor --json` to inspect local setup, or add `--remote` to verify project access.

## What this starter is

A working participant app with sample content. It signs people in, lists quests, submits claim, quiz, photo, text, and URL evidence, and shows staff-confirmed and automatic quests. The sample quests and copy introduce Domino itself; replace them with the campaign in CAMPAIGN.md.

The interface is neutral on purpose: black, white, and grey with automatic dark mode, one font (Geist), and no logo or accent color. `src/styles.css` defines five color tokens (`background`, `foreground`, `muted`, `border`, `subtle`) and components only use those names, so changing the tokens restyles everything. The starter supplies no brand identity. Apply the owner's confirmed brand direction.

Stack: Vite, React 19, TanStack Router (routes declared in code), Tailwind CSS v4, and a Hono app on Cloudflare Workers. The browser part is a single-page app; the Worker in `server/` serves it, proxies Domino, and owns any server logic. Do not add SSR.

## Where things are

| Path                | Role                                                           | Expect to                         |
| ------------------- | -------------------------------------------------------------- | --------------------------------- |
| `CAMPAIGN.md`       | Owner's brief                                                  | Read first                        |
| `quests/*.quest.ts` | Quest definitions, discovered automatically                    | Replace the samples               |
| `src/content.ts`    | All sample copy and the display order of unplaced quests       | Rewrite                           |
| `src/project.json`  | The project name from Console, written at creation             | Keep; the app reads the name here |
| `src/styles.css`    | Tailwind entry point, neutral color tokens, font               | Rebrand here first                |
| `src/router.tsx`    | Every route, in one list                                       | Add a route when you add a page   |
| `src/pages/`        | Pages: `/`, `/quests/$questId`, `/guide`, and the layout       | Restyle, add, remove              |
| `src/components/`   | Quest card, quest actions, sign-in, header and footer          | Restyle or rebuild                |
| `src/api.ts`        | Typed browser client for the app's own `/api` routes           | Use it to call `server/api.ts`    |
| `server/index.ts`   | The Worker: Domino's routes, then `/api`, then the app's files | Rarely changes                    |
| `server/api.ts`     | The app's own server routes (Hono), under `/api`               | Add server logic here             |
| `server/env.ts`     | Worker bindings                                                | Add variables and secrets here    |
| `tests/`            | Vitest tests for the Worker                                    | Extend with your routes           |
| `relay.json`        | Project identity, collection slots, supported interactions     | Edit deliberately                 |

This app is now the Devcon booth selfie campaign: one page (`src/pages/home.tsx`) built around `src/components/booth.tsx`, and one quest (`quests/booth-selfie.quest.ts`). The sample `/guide` and quest pages were removed; `supportedInteractions` is `["photo"]`.

## The Domino hooks

`@domino-sdk/relay/react` separates Domino behavior from presentation. `RelayProvider` in `src/main.tsx` holds one client for the whole app: it follows the signed-in member's activity feed and reads again only what each event changes. Build UI on these hooks instead of calling the SDK from components; they are versioned platform code, so fixes arrive with package upgrades:

- `useExperience()` returns `{ status, data, error, refresh, deliveries }`: `status` is `loading`, `signed-out`, `error`, or `ready`, with `{ quests, collections }` in `data`. On `ready`, a non-null `error` means the latest refresh failed and `data` may be stale; render `error.message`. One observer polls for the whole app. Call `refresh()` after anything that changes progress. `useSession().member` is the signed-in member, or null.
- `questGroups(experience.data, order)` returns what to list: Console collections in operator order, then unplaced quests.
- `useQuest(view)` returns the current view plus `submit`, `resume`, `retry`, `isPending`, `error`, `notice`, `saved`, and `draft`.
- `questStatusText(view)` and `canSubmit(view)` turn a quest into a `label` (plus `detail`), a `tone`, and whether to show an input. `questStatus(view)` returns the `tone` and `code` without English. `questActionState(quest)` turns a `useQuest()` result into `open` (show the input), `counted` (the submission just sent was accepted on a repeatable quest), and `automatic` (the server owns every run, so offer nothing to press).
- `isFinished(view)`, `canRepeat(view)`, `isAutomatic(view)`, and `completionCountText(view)` cover repeatable and automatic quests. `view.completed` means "completed at least once"; `isFinished(view)` means the quest is over.
- `useSignInOptions()` lists every sign-in method the project configured as one list: OAuth providers, installed wallets of the families the project enabled, and email codes, each with a `label`, an `icon` hint and `start()` (email: `sendCode()`, then `verifyCode()`). Its `options` keep SDK 1.x's closed provider list, so render the OAuth buttons from `signInProviders` instead: every sign-in provider Domino configured, Telegram Login included, each with a `label`, an `icon` hint and `start()`. Cosmos wallets need the app's chains: pass `useSignInOptions({ cosmos: [{ chainId: "cosmoshub-4" }] })` in `src/components/sign-in.tsx`; without them it offers none and reports `cosmos-chains-missing` in `unavailable` (`cosmos-chains-invalid` for a chain it cannot read, such as `"cosmoshub-4"` without `cosmos:`). In development the sign-in form shows either as a note; a production build never shows it to participants. `useSignOut()` signs out with `mutate()`; `isPending` and `error` follow it.
- `useAccounts()` lists connected accounts (X, Discord, Google, Apple) in `data`, with `connect` and `disconnect`. `error` is the failed read, `actionError` the failed connect or disconnect; both are `RelayError`s, rendered by `.message`.
- `useLeaderboard(id)`, `useReferralSummary()`, and `useInvitation()` cover rankings, invite links, and accepting an invitation after sign-in. Every read hook returns the same `{ status, data, error, refresh }`.
- `useRelay()` returns the participant client for anything the hooks don't cover. Read through it with `useRelayQuery(key, read)` or `useMemberQuery(key, read)` so the value is cached and shared, and pass `read`'s `{ signal, session }` as the client method's last argument. Prefix your own keys with the app's name; `useInvalidate()` marks keys out of date after a change.

Keep these behaviors when you redesign:

- Submission receipt is not completion. Show checking, review, rejection, and completion from the observed quest, not from the submit call.
- When a quest changes mid-submission, show the latest version and the recovered draft. The participant resubmits; the app never does it for them.
- Offer `resume` for an interrupted submission instead of a fresh form. Use `retry` only when verification failed to run.
- Render every interaction listed in `supportedInteractions` in relay.json: `claim`, `quiz`, `photo`, `text`, `url`, `staff`, `automatic`. Remove an entry only if the app truly cannot show it.
- A repeatable quest (`completion.kind === "keyed"`) stays open after each accepted submission: show the normal submit action with a blank form, plus its completion count. Count only once-only quests in "x of y completed".
- Every automatic quest (`isAutomatic(view)`) shows a status as its whole interface, because Domino or an operator owns each run and Domino refuses participant retries for them. One driven by observed activity (`questStatus(view).code === "automatic"`) reads "Automatic" with its completion count; the rest read "In progress", also after a failed run.
- `RelayProvider` filters hidden quests out of every poll. Build lists, links, and counts from `useExperience()` so they stay out.

## Server code

The browser never holds secrets or management access. Code that needs them goes in `server/api.ts` and the browser calls it through `src/api.ts` (`await api.status.$get()`). The build fails if code under `src/` imports `server/`, `@domino-sdk/relay/server` or `@domino-sdk/relay-cli`; `import type` stays allowed, which is how `src/api.ts` gets its types. Add Worker variables and secrets to `server/env.ts`, never to `src/`. Declare each secret with a description in `relay.json` `app.secrets` and set its value with `domino secrets set NAME`; staged builds receive it, `domino dev` reads `.dev.vars`.

## Quests

Console owns quest instances, collection placement, and operator overrides. Source owns reusable definitions and defaults. Preserve stable authored quest keys and collection slots. Registering a new type version does not upgrade existing instances.

Collections order the quests operators place in them. For unplaced quests, set the order in `questOrder` in `src/content.ts`.

The starter's sample quests, `welcome` included, are archived in test. Resolve campaign-specific rules with the owner before assigning rewards or promising inventory, and run `pnpm exec domino capabilities --json` before designing rankings, referrals, or tiered rewards.

## Working

- `pnpm exec domino dev` runs the app on hosted test data with real sign-in and prints a shareable HTTPS URL. All development uses the hosted test environment and real providers.
- `pnpm test` runs the Worker tests in `tests/`. Add a test with each server route.
- `pnpm check` typechecks the app, the Worker, and the quests. `pnpm exec domino check --json` also validates quests and the manifest. `pnpm build` produces private Worker modules in `dist/server/` and browser assets in `dist/client/`.
- To add a page, write it in `src/pages/` and add its route to `src/router.tsx`. Links and params are type-checked against that list.
- Before reporting done: sign in through the running app, complete the main quest, reload, and confirm the progress is still there.
- Follow the bundled skill’s source and release workflow before shared staging. `pnpm exec domino stage --commit <full-sha> --json` builds the integrated commit into a preview that stays online. Production publication requires Console review.

`@domino-sdk/relay` and `@domino-sdk/relay-cli` come from npm at the version `package.json` pins. Upgrade both together to the same version instead of editing them in `node_modules`. Credentials belong in the CLI credential store or platform secret storage.
