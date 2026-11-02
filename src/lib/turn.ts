import { checkRestrictedTopic } from "./guardrails";
import { compose } from "./compose";
import { deriveState, resolveQuery } from "./conversation";
import type { ConversationState, ResolvedQuery } from "./conversation";
import { classifySmallTalk, correctTypos, isMostlyNonEnglish } from "./language";
import { selectMediaForQuery } from "./media";
import { resolvePackageContext } from "./packages";
import type { PackageContext } from "./packages";
import type { ChatTurnMessage } from "./types";

export function extractPackageContext(history: ChatTurnMessage[]): PackageContext {
  return resolvePackageContext(history.filter((m) => m.role === "user").map((m) => m.content));
}

export function extractCarryoverPackage(history: ChatTurnMessage[]): string | null {
  return extractPackageContext(history).focus?.pkg ?? null;
}

/** Everything the agent knows about the visitor's message before deciding how to answer it. */
export interface Turn {
  rawQuery: string;
  /** The message as understood (typo-corrected when that was needed). */
  query: string;
  history: ChatTurnMessage[];
  /** Trace text describing a typo correction, or "". */
  typoNote: string;
  packageContext: PackageContext;
  convo: ConversationState;
  resolved: ResolvedQuery;
  /** Package carried over from earlier turns, if any. */
  carryover: string | null;
}

/** Is the message something the concierge can act on as typed? */
function isUnderstood(query: string, history: ChatTurnMessage[]): boolean {
  if (classifySmallTalk(query) || selectMediaForQuery(query).selectedMedia.length) return true;
  const state = deriveState(history);
  const resolved = resolveQuery(query, state);
  return Boolean(checkRestrictedTopic(resolved.text)) || compose(resolved, state).answered;
}

/** Typo tolerance: only applied when the message as typed is not understood but the corrected one is. */
function applyTypoTolerance(rawQuery: string, rawHistory: ChatTurnMessage[]): Pick<Turn, "query" | "history" | "typoNote"> {
  const unchanged = { query: rawQuery, history: rawHistory, typoNote: "" };
  if (isMostlyNonEnglish(rawQuery)) return unchanged;
  const typo = correctTypos(rawQuery);
  if (!typo.changes.length || isUnderstood(rawQuery, rawHistory)) return unchanged;
  const fixedHistory = rawHistory.map((m) => (m.role === "user" ? { ...m, content: correctTypos(m.content).text } : m));
  if (!isUnderstood(typo.text, fixedHistory)) return unchanged;
  const changes = typo.changes.map((c) => `“${c.from}” → “${c.to}”`).join(", ");
  return { query: typo.text, history: fixedHistory, typoNote: ` · Typo tolerance: read as “${typo.text}” (${changes}).` };
}

export function prepareTurn(rawQuery: string, rawHistory: ChatTurnMessage[]): Turn {
  const { query, history, typoNote } = applyTypoTolerance(rawQuery, rawHistory);
  const packageContext = extractPackageContext(history);
  const convo = deriveState(history);
  return { rawQuery, query, history, typoNote, packageContext, convo, resolved: resolveQuery(query, convo), carryover: packageContext.focus?.pkg ?? null };
}
