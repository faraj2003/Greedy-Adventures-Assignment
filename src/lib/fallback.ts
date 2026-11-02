import { Composition, renderComposition } from "./compose";
import { GENERIC_UNAVAILABLE } from "./guardrails";
import { classifySmallTalk, smallTalkReply } from "./language";
import { mentionedPackages } from "./packages";

export { mentionedPackages };

export interface FallbackResult {
  answered: boolean;
  text: string;
  topic: string;
}

/**
 * Deterministic (no-LLM) reply. It contains no answer logic of its own: small talk and
 * file-only requests are handled here, everything else is whatever `compose` produced, so
 * the deterministic path and the live-model draft always say the same thing.
 */
export function deterministicAnswer(
  query: string,
  opts: { mediaRequested?: boolean; mediaOnly?: boolean; composition?: Composition } = {},
): FallbackResult {
  const smallTalk = classifySmallTalk(query);
  if (smallTalk) return { answered: true, text: smallTalkReply(smallTalk), topic: "smalltalk" };
  if (opts.mediaOnly) return { answered: true, text: "Here is what you asked for.", topic: "media-only" };
  if (opts.composition?.sections.length) return { answered: opts.composition.answered, text: renderComposition(opts.composition), topic: "composed" };
  if (opts.mediaRequested) return { answered: true, text: "Here is what you asked for.", topic: "media-only" };
  return { answered: false, text: GENERIC_UNAVAILABLE, topic: "unmatched" };
}
