import type { ChatSourceRef, ChatTurnMessage, MediaAsset } from "./types";

/**
 * Structured extras that travel with an assistant message (media cards, source links,
 * error state). They live in assistant-ui message metadata (`metadata.custom.payload`),
 * never inside the message text.
 */
export interface ChatPayload {
  media?: MediaAsset[];
  sources?: ChatSourceRef[];
  error?: boolean;
}

/** The /api/chat schema accepts at most this many history turns. */
export const MAX_HISTORY_TURNS = 20;
export const MAX_TURN_CHARS = 4000;

export interface PlainTurn {
  role: "user" | "assistant";
  text: string;
}

/**
 * Builds the history sent to the server. The "visitor selected the X package card" line is
 * pinned: it is reserved a slot first and then the most recent turns fill the rest, so a long
 * chat can never push it out of the window.
 */
export function buildHistory(turns: readonly PlainTurn[], selectedPackageLabel: string | null): ChatTurnMessage[] {
  const recent = turns
    .map((t): ChatTurnMessage => ({ role: t.role, content: t.text.slice(0, MAX_TURN_CHARS) }))
    .filter((t) => t.content);
  if (!selectedPackageLabel) return recent.slice(-MAX_HISTORY_TURNS);
  const pinned: ChatTurnMessage = { role: "user", content: `The visitor selected the ${selectedPackageLabel} package card.` };
  return [pinned, ...recent.slice(-(MAX_HISTORY_TURNS - 1))];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isSafeUrl = (v: unknown): v is string => typeof v === "string" && /^(https:\/\/|\/(?!\/))/.test(v);

function isMediaAsset(v: unknown): v is MediaAsset {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    (v.type === "pdf" || v.type === "video" || v.type === "link") &&
    typeof v.title === "string" &&
    isSafeUrl(v.url) &&
    typeof v.sizeOrDuration === "string" &&
    typeof v.sourceUrl === "string" &&
    typeof v.isDemoMaterial === "boolean" &&
    typeof v.description === "string"
  );
}

const isSourceRef = (v: unknown): v is ChatSourceRef => isRecord(v) && typeof v.title === "string" && isSafeUrl(v.url);

/** Validates a payload read back from storage or message metadata. Returns undefined when empty or malformed. */
export function parsePayload(value: unknown): ChatPayload | undefined {
  if (!isRecord(value)) return undefined;
  const media = Array.isArray(value.media) ? value.media.filter(isMediaAsset) : [];
  const sources = Array.isArray(value.sources) ? value.sources.filter(isSourceRef) : [];
  const error = value.error === true;
  if (!error && !media.length && !sources.length) return undefined;
  return { ...(error ? { error } : {}), ...(media.length ? { media } : {}), ...(sources.length ? { sources } : {}) };
}

/** Builds the payload for a reply, or undefined when there is nothing to attach. */
export function makePayload(parts: ChatPayload): ChatPayload | undefined {
  return parsePayload(parts);
}
