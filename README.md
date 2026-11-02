# Greedy Adventures — Sea View Skydiving Concierge

A responsive experience page for Sea View Skydiving (Pattaya) with an AI concierge that answers only from verified source text, delivers the right PDF or video when asked, and shows exactly how every answer was produced.

**Live site:** https://greedyyyadventuresassignment.vercel.app/
**Stack:** Next.js 15 (App Router), TypeScript, Tailwind, `@assistant-ui/react`, Vercel AI SDK, OpenRouter

---

## 2-minute tour (for reviewers)

1. Open the live site and click the chat launcher.
2. Ask **"How much is the VIP package?"** and check the answer against the package section.
3. Ask **"Does it include video?"**. The answer should stay on VIP, with no attachment.
4. Ask **"Send me the brochure"** and then **"Show me a video"**. Each delivers the right file and nothing extra.
5. Ask **"What are your opening hours?"**. It honestly says it doesn't have that.
6. Open **Knowledge** in the header (or `/#knowledge`) to see the sources, the media decision, the router reason and whether the model was really called.

---

## What makes this different from a typical chatbot

- **Grounded, not guessing.** Every answer is built from retrieved source text. If the sources don't contain the answer, the concierge says so instead of inventing one.
- **Every reply is explainable.** A read-only Knowledge View shows the sources, the media decision, the router reason and the model status.
- **Honest about the model.** The trace separates "a key is configured" from "a request actually reached the provider," so it never claims live AI when it wasn't used.
- **Works without a key.** A clearly labelled fallback mode answers from the same sources, so the app still works if the model is unavailable.
- **Repeatable verification.** 53 automated API checks plus a manual checklist cover answers, follow-ups, media, missing information and failures.

---

## 1. Setup

```bash
npm ci
cp .env.example .env.local     # optional: add OPENROUTER_API_KEY for live AI
npm run dev                    # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | Enables live model answers. Server-side only; never returned by any API. |
| `MODEL_NAME` | Model used in live mode. |
| `SITE_URL` | Public URL sent to OpenRouter as the referer. |
| `RATE_LIMIT_PER_MINUTE` | Requests per client per minute (default 20). |

**Modes**

- **Live AI:** a key is present and the chat badge reads "Live AI".
- **Demo mode (fallback):** no key. The badge reads "Demo mode (no AI key)" and the trace labels it `GROUNDED_DETERMINISTIC_MOCK`. Answers still come from the same sources.

**Deploying on Vercel:** import the repo, add `OPENROUTER_API_KEY` under Environment Variables, deploy.
**Never set** `ENABLE_FAILURE_INJECTION` or `NEXT_PUBLIC_ENABLE_DEV_CONTROLS` on a deployed environment. They exist for local testing only and are ignored in production.

---

## 2. Sources

All answers come from a saved snapshot of public pages on **greedyadventures.com**: the Sea View Skydiving experience page, the Pattaya and skydiving pages, contact, terms and the booking page. The snapshot was captured and re-checked on **2026-10-31**.

- Source text and URLs: `src/lib/knowledge.ts`
- Package prices and inclusions: `src/lib/packages.ts`
- Each answer shows the exact source text it used in the Knowledge View.

Prices and policies are a snapshot and are not refreshed automatically, so confirm them with the operator before relying on them.

**Media:** the brochure PDF and the MP4 video are **demo material created for this project** and labelled as such in the UI. The video is an 18-second clip assembled from still photos. Replace both with operator-approved files in `src/lib/media.ts` before production.

---

## 3. How the agent works

```
Visitor message
   │
   ▼
1. Validate + rate-limit          (empty, oversized, bad role, malformed JSON rejected)
2. Front-door checks              (language.ts: English-only notice, small talk, typo repair)
3. Intent + package context       (intents.ts, packages.ts: focus package, stated choice)
4. Retrieve sources               (keyword scoring with a relevance cutoff)
5. Media planning                 (mediaPlan.ts: PDF, video, both or none)
6. Answer                         (live model if keyed, otherwise deterministic fallback)
7. Guardrails                     (answerGuards.ts: decline anything unsupported)
   │
   ▼
Reply + trace (sources, media, router reason, model status)
```

**Key design decisions**

- **Retrieval before generation.** The model only sees retrieved excerpts, and irrelevant sources are filtered out. Off-topic questions send no sources at all.
- **Explainable retrieval.** Keyword scoring, light stemming and a small synonym table are used on purpose so every match can be traced and debugged.
- **Package memory in two layers.** The concierge tracks the package *in focus* (so "does it include video?" still resolves) separately from the visitor's *stated choice*. A passing mention never overwrites a real choice, and a package the visitor rules out is dropped.
- **Questions are not decisions.** "Can I book VIP in advance?" is treated as a reference, not a selection.
- **Media is decided before the model runs.** Requests for a brochure or video are routed by rules, so delivery doesn't depend on the model behaving.
- **No booking flow.** The concierge says plainly that it can't book and points to the booking form.

---

## 4. Opening the Knowledge View

Click **Knowledge** in the site header, or open `/#knowledge` directly. It is read-only and updates after every chat reply. It shows:

| Field | Meaning |
| --- | --- |
| Configured mode | Whether a key is present |
| `modelRequestAttempted` | The app took the model path |
| `modelCallStarted` | The AI SDK call was started |
| `providerRequest` | `not_sent`, `dispatched_no_response` or `confirmed` (observed at the HTTP layer) |
| `failureInjected` | A synthetic test error was raised instead of a real call |
| `modelSkipReason` | Why no provider request was confirmed |
| Sources | Exact retrieved text and URLs |
| Context block | Labelled "sent to the model" only when `providerRequest` is `confirmed` |
| Media | Which files were attached and why |
| Router reason | Which rule or typo repair fired |

The trace is also returned for failed requests, so errors can be inspected too.

---

## 5. Verification

### 5.1 Automated (repeatable)

```bash
npm run typecheck
npm run test:unit          # unit tests
npm run verify             # 53 API checks, isolated local server, fallback mode
npm run verify:prod        # builds and runs the production server; dev controls must stay off
BASE_URL=https://<your-app>.vercel.app npm run verify:live   # needs a key; proves the model path
```

`verify:live` fails unless the trace shows `LIVE_LLM`, `modelCallStarted = true` and `providerRequest = confirmed` (HTTP 200), and unless the model declines an out-of-scope question. Checks that depend on exact wording are skipped automatically in live mode. Cases are in `scripts/verify/cases/`.

### 5.2 Manual checklist

After each step, open the Knowledge tab and confirm the evidence.

| # | Area | What to do | Expected result | Evidence |
| --- | --- | --- | --- | --- |
| 1 | **Answers** | Ask about price, duration, altitude, weight and age limits, fitness | Correct, specific answer | Matching source listed |
| 2 | **Follow-ups** | Select a package card, then ask "does it include video?" | Answer applies to that package | Focus package shown in trace |
| 3 | | Ask "and for my wife too?" | Party size increases and the total is recalculated | Router reason notes the follow-up |
| 4 | | Mention VIP, then say "I'll go with ECO", then ask about VIP | Choice stays ECO; VIP only moves the focus | Focus and stated choice both shown |
| 5 | **PDF delivery** | Ask "send me the brochure" | PDF card with working Open and Download; no video | Media: PDF only |
| 6 | **Video delivery** | Ask "show me a video" | Playable video card; no PDF | Media: video only |
| 7 | **Both** | Ask for the brochure and the video together | Both attached | Media: PDF and video |
| 8 | **No false media** | Ask "does it include a video?" | Text answer, nothing attached | Media: none |
| 9 | **Missing information** | Ask about opening hours, season, travel time, reviews | Polite "I don't have that"; nothing invented | No unsupported claim |
| 10 | | Ask an unrelated question ("who won the cricket match?") | Declined as out of scope | No sources sent |
| 11 | | Write a message in Thai | Clear English-only notice | Router reason |
| 12 | **Typos** | Ask "whats the pirce of deluxe" | Understood and answered | Router reason shows the repair |
| 13 | **Model failure** | Locally set `NEXT_PUBLIC_ENABLE_DEV_CONTROLS=true`, use "simulate service error" | Friendly generic error; chat remains usable | `failureInjected = true`; no key or raw error shown |
| 14 | **Fallback** | Remove `OPENROUTER_API_KEY`, restart | Demo mode badge; answers still grounded | Mode `GROUNDED_DETERMINISTIC_MOCK` |
| 15 | **Production safety** | Open the deployed site | No "simulate service error" switch visible | Visual check |

### 5.3 Repeatable checks for media selection and fallback

`npm run verify` automatically tests:

- PDF-only, video-only, and PDF+video routing
- No media attached for "does it include…" questions (CHK-28)
- Every media file is actually served
- A missing PDF does not block the video, and a missing video does not block the PDF (CHK-33, CHK-34)
- Provider-shaped failures (auth, rate limit, timeout, 5xx) never leak keys or URLs (CHK-32)
- Fallback answers remain grounded when no key is set
- Rate limiting, including under concurrent requests (CHK-36, CHK-39)
- `/api/health` responds and reports only the mode (CHK-42)

Failure injection works only when `ENABLE_FAILURE_INJECTION=true` **and** `NODE_ENV` is not `production`. Against a deployment, those checks report `SKIP`.

---

## 6. Failure handling

- Model calls time out after **20 s** and retry once.
- Visitors see a generic, friendly message. The trace stores only a coarse category (timeout, rate limit, authentication, server error). Raw provider errors are logged server-side only.
- A failed reply is treated as UI state and is kept out of the history sent to the server.
- Requests are rate-limited per client using platform-set IP headers.

---

## 7. Limitations

- **English only.** Thai and other non-Latin scripts get an explicit English-only notice.
- **Keyword retrieval.** It is explainable but unusual phrasings can still miss. At scale it would be replaced by embeddings and a crawler.
- **Static snapshot.** Sources don't refresh automatically and will drift if the website changes.
- **No bookings.** The concierge can't reserve anything.
- **Demo media.** The PDF and video are demo files, not operator footage.
- **In-memory rate limiter.** It is per server instance. Strict limits on serverless would need a shared store such as Upstash Redis.
- **Browser tests.** The Playwright suite (`npm run test:e2e`) is written, but it should be run once and the page checked on a real phone.
- **Free model.** The default model is a free tier and may be rate-limited or slow.

---

## 8. AI assistance disclosure

- **My role:** I defined the product requirements, designed the architecture and made the key design decisions: grounded answers only, retrieval before generation, the Knowledge View and trace, rule-based media routing, the fallback mode, and the verification approach.
- **Claude's role:** I used Claude (Anthropic) as an implementation assistant. It wrote code, verification scripts and documentation to my specifications, and later helped diagnose and fix the Vercel deployment failure (a lockfile mismatch, a TypeScript error and lint errors).
- **My review and testing:** I reviewed the output, ran the checks and tested the deployed site myself.
- **At runtime:** the concierge calls the model named in `MODEL_NAME` through OpenRouter.
