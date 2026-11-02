import { BackendActivityTrace } from "./types";

export function contextWording(trace: Pick<BackendActivityTrace, "modelCallStarted" | "providerRequest" | "modeLabel" | "failureInjected">) {
  if (trace.providerRequest === "confirmed") {
    return {
      heading: "Retrieved sources and the exact text passed to the model",
      sourceAria: "passed to the model",
      empty: "No source excerpt matched this question, so nothing was passed to the model.",
      summary: "Show the complete context block sent to the model",
      blockAria: "Complete context block sent to the model",
    };
  }
  if (trace.failureInjected) {
    return {
      heading: "Retrieved sources (simulated provider failure: nothing was sent to a model)",
      sourceAria: "retrieved but not sent to a model",
      empty: "No source excerpt matched this question, and the model call was replaced by a simulated failure.",
      summary: "Show the complete retrieved context (not sent to any model: simulated failure)",
      blockAria: "Complete retrieved context block, not sent to a model",
    };
  }
  if (trace.modelCallStarted) {
    const dispatched = trace.providerRequest === "dispatched_no_response";
    return {
      heading: dispatched
        ? "Retrieved sources (the request was dispatched but no provider response was received: delivery is unconfirmed)"
        : "Retrieved sources (the model call started but no request reached the provider)",
      sourceAria: dispatched ? "dispatched to the model provider, delivery unconfirmed" : "retrieved but not sent to a model",
      empty: "No source excerpt matched this question, and no provider request was confirmed.",
      summary: dispatched ? "Show the complete context block (dispatched, delivery unconfirmed)" : "Show the complete retrieved context (no request reached the provider)",
      blockAria: dispatched ? "Complete context block, dispatched but delivery unconfirmed" : "Complete retrieved context block, not sent to a model",
    };
  }
  if (trace.modeLabel === "LIVE_LLM") {
    return {
      heading: "Retrieved sources (the model was not called, so this text was not sent to it)",
      sourceAria: "retrieved but not sent to a model",
      empty: "No source excerpt matched this question, and no model was called.",
      summary: "Show the complete retrieved context (not sent to any model for this question)",
      blockAria: "Complete retrieved context block, not sent to a model",
    };
  }
  return {
    heading: "Retrieved sources and the text read by the deterministic fallback (no model was called)",
    sourceAria: "read by the deterministic fallback",
    empty: "No source excerpt matched this question, so nothing was available to the deterministic fallback.",
    summary: "Show the complete retrieved context (not sent to any model in this mode)",
    blockAria: "Complete retrieved context block",
  };
}
