import { BackendActivityTrace, ProviderRequestState } from "./types";

/** Mutable per-request facts about the model call, filled in as the request progresses. */
export interface RequestState {
  modelRequestAttempted: boolean;
  modelCallStarted: boolean;
  providerRequest: ProviderRequestState;
  providerResponseStatus?: number;
  failureInjected: boolean;
  modelSkipReason?: string;
}

export type TraceOutcome = Pick<
  BackendActivityTrace,
  "status" | "retrievedSources" | "passedContext" | "selectedMedia" | "missingMedia" | "routerReason" | "answer"
>;

function defaultNoProviderReason(state: RequestState): string {
  if (state.modelCallStarted && state.providerRequest === "dispatched_no_response") {
    return "The SDK call was started and an HTTP request was dispatched, but no response from the provider was received, so delivery to the provider is unconfirmed.";
  }
  if (state.modelCallStarted) return "The SDK call was started but failed before any HTTP request was sent to the provider.";
  return "No model request was made for this question.";
}

/** Creates the request state plus a builder that stamps it, with the outcome, into a trace. */
export function createTrace(init: { query: string; memoryContext: string; liveMode: boolean; modelName: string }) {
  const state: RequestState = {
    modelRequestAttempted: false,
    modelCallStarted: false,
    providerRequest: "not_sent",
    failureInjected: false,
  };

  const build = (outcome: TraceOutcome): BackendActivityTrace => ({
    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    query: init.query,
    memoryContext: init.memoryContext,
    modeLabel: init.liveMode ? "LIVE_LLM" : "GROUNDED_DETERMINISTIC_MOCK",
    modelRequestAttempted: state.modelRequestAttempted,
    modelCallStarted: state.modelCallStarted,
    providerRequest: state.providerRequest,
    ...(state.providerResponseStatus !== undefined ? { providerResponseStatus: state.providerResponseStatus } : {}),
    failureInjected: state.failureInjected,
    ...(state.providerRequest === "confirmed" ? {} : { modelSkipReason: state.modelSkipReason ?? defaultNoProviderReason(state) }),
    modelName: init.liveMode ? init.modelName : "none configured (deterministic fallback)",
    ...outcome,
  });

  return { state, build };
}
