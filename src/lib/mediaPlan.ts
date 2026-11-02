import { detectIntents } from "./intents";
import { partitionAvailableMedia, selectMediaForQuery } from "./media";
import { topicOf } from "./patterns";
import { MediaAsset, MediaType } from "./types";

const FILE_REQUEST_WORDS = topicOf("send", "share", "download", "attach", "email", "watch", "play", "show me", "give me", "brochure", "pdf");
/** Words that mean the visitor is asking a question about a package, not only requesting a file. */
const PACKAGE_QUESTION_WORDS = topicOf("prices?", "cost", "how much", "includ\\w*", "compare", "differen\\w*", "total", "what", "which", "how", "why", "when", "where", "cheaper", "cheapest", "better", "worth");
const FOOTAGE_QUESTION_INTENTS = ["combined_media", "joint_booking", "budget", "recommendation", "total_cost"];

export interface MediaPlan {
  /** Why the media router did or did not pick files. */
  routerReason: string;
  /** Files the visitor asked for (empty when the question is refused or is about footage, not files). */
  requested: MediaAsset[];
  /** The visitor only wants files; no package answer is needed. */
  mediaOnlyRequest: boolean;
  available: MediaAsset[];
  missing: MediaAsset[];
}

export function planMedia(input: { query: string; resolvedText: string; refused: boolean; missingOverride?: MediaType[] }): MediaPlan {
  const decision = selectMediaForQuery(input.query);
  const asksAboutFootage = detectIntents(input.resolvedText).some((i) => FOOTAGE_QUESTION_INTENTS.includes(i)) && !FILE_REQUEST_WORDS.test(input.resolvedText);
  const requested = input.refused || asksAboutFootage ? [] : decision.selectedMedia;
  // Naming a package next to "send the brochure" is still a file request, not a question about that package.
  const mediaOnlyRequest = requested.length > 0 && !PACKAGE_QUESTION_WORDS.test(input.resolvedText);
  const { available, missing } = partitionAvailableMedia(requested, input.missingOverride);
  return { routerReason: decision.routerReason, requested, mediaOnlyRequest, available, missing };
}

export function mediaLeadIn(media: MediaAsset[], missing: MediaAsset[]): string {
  const parts: string[] = [];
  if (media.length) {
    const names = media.map((m) => (m.type === "pdf" ? "the brochure (PDF)" : m.type === "video" ? "the preview video" : "the official experience page"));
    parts.push(`Here ${names.length > 1 ? "are" : "is"} ${names.join(" and ")} below.`);
    const demo = media.filter((m) => m.isDemoMaterial).map((m) => (m.type === "pdf" ? "brochure" : "video"));
    if (demo.length) parts.push(`The ${demo.join(" and ")} ${demo.length > 1 ? "are" : "is"} clearly labelled demo material, not official operator collateral.`);
  }
  if (missing.length) {
    parts.push(`I couldn't attach ${missing.map((m) => (m.type === "pdf" ? "the brochure" : "the video")).join(" or ")} because the file isn't available on the server right now.`);
  }
  return parts.join(" ");
}
