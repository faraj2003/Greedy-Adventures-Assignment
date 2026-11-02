# Greedy Adventures — Sea View Skydiving

A responsive Next.js 15 + TypeScript experience page with an AI concierge for Sea View Skydiving (Pattaya). The chat UI uses `@assistant-ui/react`; the server validates requests, retrieves excerpts from a curated public-information corpus, routes media requests, and answers through OpenRouter when a key is configured.

## Run locally

```bash
npm ci
cp .env.example .env.local     # add OPENROUTER_API_KEY for live AI answers; set SITE_URL to your public URL
npm run dev
```

Without `OPENROUTER_API_KEY` the concierge runs in a **clearly labelled deterministic fallback** (`GROUNDED_DETERMINISTIC_MOCK` in the Knowledge View, and a "Demo mode (no AI key)" badge in the chat header). With a key, the server calls `MODEL_NAME` (default `google/gemma-4-26b-a4b-it:free`) and the badge reads "Live AI". The key is read only on the server and never returned by any API (`/api/health` reports only the mode).

### Demonstrating the live model

The submitted deployment should have `OPENROUTER_API_KEY` set in Vercel (Project → Settings → Environment Variables). Then prove the model path end to end:

```bash
BASE_URL=https://<your-app>.vercel.app npm run verify:live
```

This fails unless the trace shows `modeLabel = LIVE_LLM`, `modelCallStarted = true` and `providerRequest = confirmed` (provider HTTP 200) for normal questions, and the model declines an out-of-scope question. It prints the real model answers. In the browser, ask any question and open the Knowledge tab: "provider request: confirmed" is the evidence.

## What the assignment asks for, and where it lives

| Requirement | Implementation |
| --- | --- |
| Premium hero + package redesign, responsive | `src/app/page.tsx` (server: reads prices/stats from `lib/facts.ts`), `src/components/site/*`, `src/data/site.ts` |
| assistant-ui chat | `src/components/AssistantChat.tsx` |
| Grounded answers, no invented facts | `src/lib/agent.ts`, `knowledge.ts`, `fallback.ts`, `guardrails.ts` |
| Follow-up context | `extractPackageContext()` in `agent.ts` using `resolvePackageContext()` in `packages.ts` (focus package + stated choice, + package-card selection) |
| PDF delivery | Real PDF card with **Open** and **Download** (`public/demo/…brochure-demo.pdf`) |
| Video delivery | Real playable **MP4 card** with poster and download (`public/demo/sea-view-skydiving-demo.mp4`) |
| PDF + video together | Both cards in one reply |
| Missing information | Explicit "not available" reply; never a generic sales answer |
| Loading / error states | Typing indicator, Stop button, error card with **Try again** |
| Read-only knowledge view | Knowledge tab: configured mode, **whether a model was actually called**, sources, the retrieved context (labelled "sent to the model" only when it was), media, answer, router reason |

## How the agent decides (`src/lib`)

1. **`guardrails.ts`** — refuses "Coming soon" activities (paragliding, scuba, snowboarding), unlisted activities (wingsuit, bungee, helicopter, …) and operational facts the corpus does not contain: discounts and group rates, insurance, the best season or time of year, safety statistics and aircraft details, and dropzone facilities (parking, food, lockers, …). Everything the knowledge base **does** cover is answered rather than refused: the **weight limit (100 kg)**, **minimum age (18)**, **medical and fitness** guidance, weather and wind, payment, how to book, clothing and cancellation/refund policy. For those, `compose.ts` quotes the source and says plainly what it does not state (for example "no maximum age is given", "no general refund policy is published"). Personal questions are answered against the rule: "I weigh 120kg, can I jump?" gets "over the 100 kg limit", and the concierge never judges whether an individual is medically fit.
2. **`language.ts`** — three small front-door checks that run before answering. *English only:* a message written mostly in a non-Latin script (for example Thai) gets a clear "I can only answer in English" reply instead of a misleading "not found". *Small talk:* greetings, thanks and goodbyes get their own short replies (so "thanks!" no longer repeats the greeting). *Typo tolerance:* if a message is not understood as typed but is understood after fixing likely typos ("what is the pric", "whats the pirce of deluxe"), the corrected text is used and the Knowledge View's router reason says what was changed; a message that already works is never rewritten.
3. **`knowledge.ts`** — keyword-scored retrieval over four captured pages, with a minimum relevance threshold, a synonym list and explicit intent boosts (`intents.ts`) so duration/altitude questions reach the timing source and opening-hours questions reach the hours source. Each retrieved chunk carries its exact `passedText`.
4. **`media.ts`** — intent classifier + registry. Questions *about* a package's media ("Does Deluxe include video?", "I want to know whether VIP has a video") are **not** treated as file requests; "I want to see the video" and "Please send me the video" are. A package name next to a file request ("send brochure and video of VIP") is still just a file request: it gets the files and a one-line lead-in, not a price answer. Before a local file is promised, `partitionAvailableMedia()` checks it exists; a missing file is reported honestly instead of a broken link.
5. **Answering** — retrieval always runs, but what happens to the retrieved text depends on the path:
   - *Live mode (key configured), question allowed:* the retrieved excerpts are sent to the model, which must answer only from them and reply `[[NO_INFO]]` when they do not contain the answer; the backend then records `UNAVAILABLE_INFO_REFUSAL`.
   - *Guardrail refusal (any mode):* the refusal is produced **before** any model request. In live mode the context is still retrieved and shown, but it is **not** sent to a model.
   - *Deterministic mode (`fallback.ts`, no key):* no model is called. The fallback reads the retrieved text locally and answers a topic only if its required facts are present (package prices are parsed from that text). Otherwise it declines.
6. **Trace** — every response returns a `BackendActivityTrace` containing the query, memory context, retrieved sources with exact text, the retrieved context block, selected media, router reason and the final answer. It separates **configured mode** (`modeLabel`: is a key present?) from what actually happened with the model: `modelRequestAttempted` (the app took the model path), `modelCallStarted` (the AI SDK call was started; this alone proves nothing reached the provider), `providerRequest` (observed at the HTTP layer through a traced `fetch`: `not_sent`, `dispatched_no_response` or `confirmed` when the provider answered, with `providerResponseStatus`; a 401 or 429 is still a *confirmed* request) and `failureInjected` (a synthetic test error was raised instead, so no provider request exists). `modelSkipReason` explains why no provider request was confirmed, so a trace never claims `LIVE_LLM` was used when a guardrail or simulated error stopped the request first. The context block is labelled "sent to the model" only when `providerRequest` is `confirmed`. The Knowledge View renders all of this, including for failed requests.

## Media: what is real and what is demo

- `sea-view-skydiving-brochure-demo.pdf` and `sea-view-skydiving-demo.mp4` are **demo material** created for this project and labelled as such in the UI and the trace. The MP4 is an 18-second clip assembled from the project's still photos with captions from the public page — it is not operator footage. Replace both with operator-approved collateral before production by editing `src/lib/media.ts`.
- The official experience page is only offered as a link when the visitor asks for the official page/website; it is never presented as a video.

## Accessibility

Native buttons and form controls; visible focus; `Escape` closes the chat and focus returns to the launcher; focus moves into the chat input when it opens and to the main region when switching between Experience and Knowledge; the message list is an `aria-live` log; the typing indicator is a `role="status"`; errors use `role="alert"`; source-text boxes are keyboard-scrollable; reduced-motion preference is respected.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Server-side provider key. Unset = labelled deterministic fallback. (The code uses the OpenAI-compatible client pointed at OpenRouter; `OPENAI_API_KEY` is not read.) |
| `SITE_URL` | Public URL sent to OpenRouter as the `HTTP-Referer` header. On Vercel the production domain is used automatically; otherwise `http://localhost:3000`. |
| `MODEL_NAME` | Model id (default `google/gemma-4-26b-a4b-it:free`). |
| `RATE_LIMIT_PER_MINUTE` | Per-client limit on `/api/chat` and `/api/knowledge` (default 20). |

See `.env.example` for the test-only switches.

## Code style

Prettier (`.prettierrc.json`, 120 columns) and ESLint enforce one style. Run `npm run format` before committing. Dependency versions are pinned exactly; update them deliberately.

## Verification

```bash
npm test              # unit tests, then `npm run verify`
npm run test:unit     # fast pure-function tests (tests/unit, node:test via tsx): agent text helpers, parseLimit, every intent detector, regressions
npm run typecheck     # TypeScript
npm run build         # production build
npm run lint          # ESLint (next/core-web-vitals + @typescript-eslint rules)
npm run format:check  # Prettier (use `npm run format` to fix)
npm run verify        # 53 API checks against an isolated local dev server (deterministic mode)
npm run verify:live   # needs a deployment with OPENROUTER_API_KEY: proves a confirmed provider request
npm run test:e2e      # Playwright browser smoke tests (see below)
npm run verify:prod   # builds, starts the PRODUCTION server and runs the same checks (developer controls must stay off)

# Against a deployed app, or to exercise the LIVE model (set OPENROUTER_API_KEY on that deployment):
BASE_URL=https://<your-app>.vercel.app npm run verify
```

`verify` is split into case files under `scripts/verify/cases/` (run in filename order; shared server and HTTP helpers are in `scripts/verify/harness.mjs`). It covers: package comparison, PDF routing, **real MP4 routing**, combined PDF+video, follow-up from history, unavailable activity, simulated failure (with trace), false-positive media prevention, read-only knowledge endpoint, **unsupported-question refusals (season, unknown topics) and grounded answers for weight, age and fitness questions**, **exact source-text tracing**, **follow-ups across different packages**, **every media file actually being served**, pickup without an invented price, input validation (empty, oversized, invalid role, malformed JSON), **package-card vs. later explicit package choice**, natural media/package phrasing, and no leaked provider errors. Checks added in this version: CHK-43 to CHK-51 (weight above/below the limit, thanks and goodbye, "and for my wife too?" follow-ups, "can you book it for me?", the unanswered-question wording, file requests that name a package, typo tolerance plus the English-only reply, "Do I need to be fit?", and weight/age/health questions being answered); wording-dependent ones are skipped in live mode. Earlier: CHK-40 (natural phrasings retrieve the right source, off-topic questions send no sources), CHK-41 (opening hours and review score are never stated) and CHK-42 (`/api/health`). Earlier additions (CHK-35 to CHK-39: travel time vs jump duration plus height phrasings, rate limiting, package statement kinds, package questions vs. choices, and rate limiting under concurrent requests). Earlier additions: natural-language duration/altitude retrieval and opening-hours separation (CHK-27), "has/have" media questions vs real requests (CHK-28), explicit package preference phrasing (CHK-29), comparisons/rejections not changing the selection (CHK-30), precise model tracing: `modelCallStarted` vs a confirmed `providerRequest` (CHK-31), provider-shaped injected failures for auth / rate limit / timeout / 5xx with no leaked key or URL, reported as `modelCallStarted=false`, `providerRequest=not_sent` and `failureInjected=true` because they are simulated and never reach a real provider (CHK-32), and a missing PDF or a missing video not blocking the other (CHK-33, CHK-34). In live mode, checks that depend on exact wording are skipped automatically.

**Failure injection.** CHK-32 to CHK-34 force failures through request fields (`simulateProviderFailure`, `simulateMissingMedia`), and CHK-36 uses a low per-client limit via the `x-test-rate-limit` header together with a unique `x-forwarded-for` value, so it cannot affect the other checks. CHK-32 therefore tests provider-*shaped* injected errors, not real provider failures. These are honoured only when `ENABLE_FAILURE_INJECTION=true` **and** `NODE_ENV` is not `production` (`src/lib/testHooks.ts`). `npm run verify` enables it for its own local server; against a deployed app those checks report `SKIP` because the hooks are off there. Never set `ENABLE_FAILURE_INJECTION` on Vercel.

## Deployment (Vercel)

1. Import the repository in Vercel (framework: Next.js; no build overrides needed).
2. Set `OPENROUTER_API_KEY` (and optionally `SITE_URL`, `MODEL_NAME`, `RATE_LIMIT_PER_MINUTE`) in Project → Settings → Environment Variables **for Production**, then redeploy. Leave it unset only if you want the labelled deterministic fallback.
3. `next.config.ts` bundles `public/demo/**` with the API functions so the media-existence check works at runtime. If a media file cannot be found, it is reported as unavailable (the check fails closed); set `MEDIA_ASSUME_AVAILABLE=true` only if you serve the files from a CDN the functions cannot inspect.
4. **Rate-limit caveat:** the limiter is per instance and not shared (see "Rate limiting and client identity"). It is a basic abuse guard, not a strict quota. Use Upstash Redis or Vercel KV if you need a global limit.
5. After deploying, run `BASE_URL=https://<your-app>.vercel.app npm run verify:live` (proves the model path) and `npm run verify` (structure checks).

## AI assistance disclosure

- **Tools:** Claude (Anthropic) was used as an AI coding assistant on this project, including drafting and revising code, the verification scripts, the browser tests and this documentation. The deployed concierge itself calls the model named in `MODEL_NAME` through OpenRouter at runtime (live mode).
- **AI-assisted parts:** the Next.js page and chat components, the retrieval/guardrail/fallback modules, the API routes, `scripts/verify-agent.mjs`, `scripts/verify-live.mjs`, `e2e/smoke.spec.ts` and the README text.
- **Reviewed, changed and tested by me:** <!-- AUTHOR: replace this line with what you personally did, e.g. "I read every module, ran npm run verify / verify:live, checked the captured content against the live pages on 2026-10-31, and tested the chat on a phone and a laptop." Keep it accurate. -->
- **Not generated by AI:** the demo PDF/MP4 are built from stock stills and captions taken from the public page (see "Media" below); the knowledge text was checked line by line against the public pages (next section).

## Source accuracy

`knowledge.ts` is a manual snapshot of four public pages, **re-checked against the live site on 2026-10-31** (the capture date stored with each source):

| Fact | Where it was confirmed |
| --- | --- |
| ECO ฿9,500 · Deluxe ฿12,500 · VIP ฿14,000 per person | `/experiences/sea-view-skydiving` |
| Same inclusions listed for every package; Deluxe = handycam video + photos, VIP = personal cameraman + edited film | same page |
| Exit 13,000 ft, ~60 s freefall, 5–7 min under canopy, ~3 h at the dropzone | same page |
| Address (95 M.4, Chakphong, Klaeng, Rayong 21190) and operator (Dropzone Thailand) | same page |
| Bangkok pickup is a fixed-price add-on (no price stated) | same page |
| Loads every day of the year; English, Hindi and Thai instructors | `/escapes/thailand/pattaya` |
| Paragliding, scuba diving, snowboarding "Coming soon"; Mount Abu in India | homepage |

Things the earlier version stated that **are not on the official pages were removed**: the "4.9/5 from 835 reviews" rating, "Monday–Sunday 8:00 AM – 6:00 PM" opening hours, the "free Greedy Adventures gift" for VIP, the "most popular" label, and a separate VIP page whose URL could not be confirmed. The concierge now says these are not available, and checks CHK-27 and CHK-41 assert that no opening time or review score is ever stated. Note that the older `greedyadventures.com/services` listing shows different (older) prices (฿9,000 / ฿12,000 / ฿13,500); the current experience page was treated as authoritative. Re-run the comparison before any real use.

## Conversation memory

Follow-up context works in two layers: the full visible history is sent with each request (up to 20 turns), and the server derives a package focus/stated choice from it. The conversation is **session-scoped**: it is kept in the browser's `sessionStorage`, so a refresh in the same tab restores the messages and the selected package card; closing the tab or browser clears it. Nothing is stored on the server and there are no accounts. The **New chat** button in the chat header wipes it immediately. Memory across devices or after the browser is closed would need server-side storage, which this prototype deliberately does not have.

## Rate limiting and client identity

`/api/chat` and `/api/knowledge` allow `RATE_LIMIT_PER_MINUTE` requests per client (default 20). The client is identified only from headers the hosting platform sets (`x-vercel-forwarded-for`, `x-real-ip`), so a visitor cannot choose their own bucket by sending `X-Forwarded-For`. `x-forwarded-for` is honoured only when `TRUST_PROXY_HEADERS=true` (your own proxy overwrites it), and then the **last** entry is used. The counters are in memory per serverless instance and reset on a cold start, so the limit is approximate on Vercel (up to `limit x instances`); use a shared store such as Upstash Redis for a strict global limit.

## Browser tests (Playwright)

```bash
npx playwright install chromium
npm run test:e2e                                   # starts the app locally in deterministic mode
BASE_URL=https://<your-app>.vercel.app npm run test:e2e   # against a deployment
```

`e2e/smoke.spec.ts` runs at 320, 375, 768, 1366 and 1920 px and checks: no horizontal overflow, prices visible, no unverified claims on the page, the chat panel stays inside the viewport, Escape returns focus to the launcher, a package answer, PDF Open/Download buttons, a playable video card that fits the chat width, refresh persistence and New chat, an honest decline for opening hours, keyboard access to the launcher, and the Knowledge View sources and capture date. These tests were written but **could not be executed in the authoring environment** (browser download blocked); run them once before submitting and look at the failure screenshots in `test-results/`. They do not replace a manual look at the page on a real phone.

## Known limitations

- **English only.** The knowledge base and the answer logic are English. Thai and other non-Latin-script messages get an explicit English-only notice. Typo tolerance is deliberately conservative (edit distance 1, or 2 for long words, against the knowledge-base vocabulary) and runs only when the message as typed is not understood, so heavily misspelled or shorthand messages can still be declined.
- **The concierge cannot take bookings.** "Can you book it for me?" gets a plain "I can't book or reserve anything" and a pointer to the booking form. A follow-up such as "and for my wife too?" adds one person to the party and recalculates the total for the package in focus; a follow-up with an unknown number ("and my kids too?") is not guessed.

- Retrieval is keyword scoring over a small, manually curated snapshot — fine for four short pages, but it would be replaced by embeddings plus a crawler at scale. It is kept deliberately explainable: light stemming, a synonym table, whole-phrase expansions ("in the air", "time spend falling"), intent boosts, a minimum score and a relative cutoff so weakly related sources are not sent to the model. Verify prices and policies with the operator.
- The rate limiter is in-memory and per server instance (see "Rate limiting and client identity"); use a shared store (e.g. Upstash Redis) for strict limits on serverless. Within one instance it is exact under concurrent requests (the check-and-increment is synchronous; CHK-39 fires a simultaneous burst), and an invalid `RATE_LIMIT_PER_MINUTE` falls back to 20 instead of disabling the limit. Across several serverless instances the effective limit is up to `limit x instances`.
- Source facts, prices and the capture date in `knowledge.ts` are a snapshot (re-checked on 2026-10-31, see "Source accuracy"); they are not refreshed automatically and will drift if the site changes.
- Retrieval ignores sources scoring below a small relevance threshold, uses a short synonym list and a few intent boosts; it is still keyword-based, so unusual phrasings can still miss. Package-preference recognition is likewise rule-based (`packages.ts`) and covers common phrasings, not all of English.
- Model calls time out after 20 s and retry once; failures show a generic message to visitors, the trace carries only a coarse category (timeout, rate limit, authentication, server error), and the raw provider error is logged server-side only.
- Deterministic mode answers a fixed set of topics; anything else is declined rather than guessed. Travel-time questions ("how long is the drive?") are recognised separately from jump duration (`intents.ts`) and declined, because the loaded information has no travel times.
- **Package statements and context** (`packages.ts`): a message is classified as a *reference* ("I'm considering VIP"), a *preference* ("I prefer ECO"), a *selection* ("I'll go with ECO"), a *comparison* ("ECO or VIP?", "Is VIP better?") or a *rejection* ("I don't want VIP"). A sentence that **asks** something ("Can I book VIP in advance?", "What if I choose Deluxe?", "Should I take VIP?") is only ever a reference, even though it contains decision verbs. The conversation carries two things: the **focus** (the package most recently talked about, so "does it include video?" still resolves) and the **stated choice** (the last preference or selection that has not been ruled out). A later mention or question moves the focus but does not erase the stated choice; a package the visitor rules out ("forget VIP") is dropped. The Knowledge View shows both (e.g. `Carryover package: VIP (reference) · Stated choice still held: ECO (selection)`), and the live model is told explicitly that a mention is not a booking. The prototype has no booking flow.
- **Developer demo control (fails closed).** The "simulate service error" switch is for reviewing the error state, not a customer feature. It is on only when `NODE_ENV` is not `production` **and** `NEXT_PUBLIC_ENABLE_DEV_CONTROLS=true`; unset, empty or any other value means off (`src/lib/devControls.ts`). `/api/chat` applies the same rule on the server and ignores `simulateError` otherwise, so hiding the button is never the only protection. `npm run verify:prod` proves this on a real production build with the flag deliberately set.
