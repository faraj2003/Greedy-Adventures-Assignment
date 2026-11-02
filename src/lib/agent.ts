import { AgentHooks, hooksFromInjection, TestInjection } from "./testHooks";
import { createTrace } from "./agentTrace";
import { interpretModelReply } from "./answerGuards";
import { compose, Composition, renderComposition } from "./compose";
import { deterministicAnswer } from "./fallback";
import { checkRestrictedTopic, refusalFor, RestrictedTopic } from "./guardrails";
import { ENGLISH_ONLY_MESSAGE, isMostlyNonEnglish } from "./language";
import { isLiveMode, MODEL_NAME, requestModelText } from "./liveModel";
import { MediaPlan, mediaLeadIn, planMedia } from "./mediaPlan";
import { classifyModelError, EMPTY_RESPONSE_MESSAGE, PUBLIC_MODEL_ERROR_TEXT } from "./modelErrors";
import { retrieveSourcesForQuery } from "./knowledge";
import { buildMemoryContext, buildPassedContext, buildSystemPrompt, buildUserPrompt } from "./prompt";
import { prepareTurn, Turn } from "./turn";
import { BackendActivityTrace, ChatApiResult, ChatTurnMessage, RetrievedSourceChunk } from "./types";

// Public API of the former single-file agent, re-exported so callers and tests keep their imports.
export { dropsVerifiedContent, stripGenericEnding, stripGenericOpening, unverifiedBaht } from "./answerGuards";
export { buildPassedContext, describePackageContextForModel, NO_INFO_TOKEN } from "./prompt";
export { extractCarryoverPackage, extractPackageContext } from "./turn";

type TraceBuilder = ReturnType<typeof createTrace>;
type Status = BackendActivityTrace["status"];

/** What the answering branches produce; `failure` replaces the answer when the model call failed. */
interface Outcome {
  answer: string;
  status: Status;
  routerReason: string;
  /** The answer is only a pointer to attached files, so no sources are cited. */
  mediaOnly: boolean;
  failure?: { text: string; routerReason: string };
}

/** Everything decided before an answering branch runs: guardrail, media, draft and retrieval. */
interface Plan {
  restricted: RestrictedTopic | null;
  anyRestricted: RestrictedTopic | null;
  media: MediaPlan;
  composition?: Composition;
  /** The draft contains only "not covered" sections. */
  onlyUnavailable: boolean;
  retrievedSources: RetrievedSourceChunk[];
  passedContext: string;
}

const errorResult = (trace: TraceBuilder, text: string, routerReason: string, extra: { retrievedSources?: RetrievedSourceChunk[]; passedContext?: string } = {}): ChatApiResult => ({
  isError: true, text, sources: [], media: [],
  trace: trace.build({ status: "MODEL_ERROR", retrievedSources: extra.retrievedSources ?? [], passedContext: extra.passedContext ?? "", selectedMedia: [], missingMedia: [], routerReason, answer: text }),
});

// ---- Routing -------------------------------------------------------------------------------

/** Requests answered before any retrieval or model call. */
function routeEarlyExit(turn: Turn, simulateError: boolean | undefined, trace: TraceBuilder): ChatApiResult | null {
  if (simulateError) {
    trace.state.modelSkipReason = "Simulated error: the request was stopped before any model call.";
    return errorResult(trace, "The concierge couldn't complete that request because a simulated service error is enabled. Turn off the developer demo error switch and retry.", "Intentional test failure requested by the user.");
  }
  if (isMostlyNonEnglish(turn.rawQuery)) {
    trace.state.modelSkipReason = "The message is not in English: answered locally with an English-only notice before any model call.";
    return {
      isError: false, text: ENGLISH_ONLY_MESSAGE, sources: [], media: [],
      trace: trace.build({ status: "UNAVAILABLE_INFO_REFUSAL", retrievedSources: [], passedContext: "", selectedMedia: [], missingMedia: [], routerReason: "Non-English input: the concierge only supports English, so it said so instead of guessing.", answer: ENGLISH_ONLY_MESSAGE }),
    };
  }
  return null;
}

function planAnswer(turn: Turn, hooks: AgentHooks): Plan {
  const { resolved, convo } = turn;
  const anyRestricted = checkRestrictedTopic(resolved.text);
  const restricted = anyRestricted && anyRestricted.kind !== "unlisted_operational_fact" ? anyRestricted : null;
  const media = planMedia({ query: turn.query, resolvedText: resolved.text, refused: Boolean(restricted), missingOverride: hooks.missingMedia });
  const composition = restricted || media.mediaOnlyRequest ? undefined : compose(resolved, convo);
  const onlyUnavailable = Boolean(composition?.sections.length && composition.sections.every((s) => s.key.startsWith("restricted:")));
  const retrievedSources = retrieveSourcesForQuery(resolved.text, turn.carryover, resolved.inherited ? convo.previousIntents : []);
  return { restricted, anyRestricted, media, composition, onlyUnavailable, retrievedSources, passedContext: buildPassedContext(retrievedSources) };
}

// ---- Answering branches --------------------------------------------------------------------

/** Guardrail branch: the topic is not supported by the sources, so refuse without a model call. */
function answerWithRefusal(plan: Plan, trace: TraceBuilder): Outcome {
  trace.state.modelSkipReason = "Guardrail refusal: answered before any model call, so the retrieved context below was NOT sent to a model.";
  const refused = plan.restricted ?? plan.anyRestricted!;
  const mediaNote = plan.media.requested.length ? ` ${plan.media.routerReason}` : "";
  return {
    answer: plan.restricted ? refusalFor(plan.restricted) : renderComposition(plan.composition!),
    status: "UNAVAILABLE_INFO_REFUSAL",
    mediaOnly: false,
    routerReason: `Guardrail: ${refused.kind.replace(/_/g, " ")} (“${refused.term}”) is not supported by the loaded sources, so the agent refused instead of guessing.${mediaNote}`,
  };
}

/** Live branch: the model rewrites the verified draft, and its reply is checked against that draft. */
async function answerWithModel(turn: Turn, plan: Plan, trace: TraceBuilder, hooks: AgentHooks): Promise<Outcome> {
  try {
    trace.state.modelRequestAttempted = true;
    hooks.beforeModelCall?.(trace.state);
    const raw = await requestModelText({
      system: buildSystemPrompt({ query: turn.query, resolved: turn.resolved, convo: turn.convo, packageContext: turn.packageContext, composition: plan.composition, mediaOnlyRequest: plan.media.mediaOnlyRequest, passedContext: plan.passedContext }),
      prompt: buildUserPrompt(turn.history, turn.query),
    }, trace.state);
    if (!raw) throw new Error(EMPTY_RESPONSE_MESSAGE);
    const reply = interpretModelReply(raw, turn.query, plan.composition);
    return { answer: reply.answer, status: reply.noInfo ? "UNAVAILABLE_INFO_REFUSAL" : "GROUNDED_OK", routerReason: `${plan.media.routerReason}${reply.note}`, mediaOnly: false };
  } catch (error) {
    console.error("[agent] model request failed:", error);
    const label = classifyModelError(error);
    const routerReason = hooks.describeFailure?.(label) ?? `Model request failed (${label}). Details are logged on the server only.`;
    return { answer: "", status: "MODEL_ERROR", routerReason, mediaOnly: false, failure: { text: PUBLIC_MODEL_ERROR_TEXT, routerReason } };
  }
}

/** Fallback branch: no API key, so the deterministic answerer replies from the same verified draft. */
function answerDeterministically(turn: Turn, plan: Plan, trace: TraceBuilder): Outcome {
  trace.state.modelSkipReason = "No OPENROUTER_API_KEY configured: the deterministic fallback answered locally and read the retrieved context itself.";
  const result = deterministicAnswer(turn.resolved.text, { mediaRequested: plan.media.requested.length > 0, mediaOnly: plan.media.mediaOnlyRequest, composition: plan.composition });
  const declined = result.answered ? "" : ", required facts not found → declined";
  return {
    answer: result.text,
    status: result.answered ? "GROUNDED_OK" : "UNAVAILABLE_INFO_REFUSAL",
    mediaOnly: result.topic === "media-only" || result.topic === "smalltalk",
    routerReason: `${plan.media.routerReason}${turn.typoNote} · Answered by the labelled deterministic fallback (topic: ${result.topic}${declined}); no OPENROUTER_API_KEY configured.`,
  };
}

// ---- Entry point ---------------------------------------------------------------------------

export async function runGroundedAgent(params: {
  query: string;
  history: ChatTurnMessage[];
  simulateError?: boolean;
  injection?: TestInjection;
}): Promise<ChatApiResult> {
  const hooks = hooksFromInjection(params.injection);
  const turn = prepareTurn(params.query, params.history);
  const liveMode = isLiveMode();
  const trace = createTrace({
    query: turn.rawQuery,
    memoryContext: buildMemoryContext({ packageContext: turn.packageContext, convo: turn.convo, resolved: turn.resolved, historyLength: turn.history.length }),
    liveMode,
    modelName: MODEL_NAME,
  });

  const early = routeEarlyExit(turn, params.simulateError, trace);
  if (early) return early;

  const plan = planAnswer(turn, hooks);
  const outcome = plan.restricted || plan.onlyUnavailable
    ? answerWithRefusal(plan, trace)
    : liveMode || hooks.forceModelPath
      ? await answerWithModel(turn, plan, trace, hooks)
      : answerDeterministically(turn, plan, trace);

  if (outcome.failure) {
    return errorResult(trace, outcome.failure.text, outcome.failure.routerReason, { retrievedSources: plan.retrievedSources, passedContext: plan.passedContext });
  }

  const { available: media, missing } = plan.media;
  const routerReason = liveMode ? `${outcome.routerReason}${turn.typoNote}` : outcome.routerReason;
  const lead = mediaLeadIn(media, missing);
  const answer = lead ? (outcome.answer === "Here is what you asked for." ? lead : `${outcome.answer}\n\n${lead}`) : outcome.answer;

  return {
    isError: false,
    text: answer,
    sources: outcome.status === "GROUNDED_OK" && !outcome.mediaOnly ? plan.retrievedSources.map(({ title, url }) => ({ title, url })) : [],
    media,
    trace: trace.build({ status: outcome.status, retrievedSources: plan.retrievedSources, passedContext: plan.passedContext, selectedMedia: media, missingMedia: missing.map((m) => m.url), routerReason, answer }),
  };
}
