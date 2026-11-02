import { Composition, renderComposition } from "./compose";
import { ConversationState, ResolvedQuery } from "./conversation";
import { PackageContext } from "./packages";
import { ChatTurnMessage, RetrievedSourceChunk } from "./types";

export const NO_INFO_TOKEN = "[[NO_INFO]]";

export function describePackageContextForModel(ctx: PackageContext): string {
  const { focus, selected } = ctx;
  if (!focus) return "No package has been mentioned or chosen by the visitor.";
  const name = focus.pkg.toUpperCase();
  const firm = focus.kind === "selection" || focus.kind === "preference";
  const lines = [firm
    ? `The visitor stated a ${focus.kind === "selection" ? "selection" : "preference"} for the ${name} package. Use it to resolve "it" / "the package". It is NOT a booking or purchase.`
    : `The visitor most recently mentioned or asked about the ${name} package. Use it only to resolve "it" / "the package" in follow-ups; it is NOT a confirmed choice, booking or purchase.`];
  if (!firm && selected) lines.push(`The visitor earlier stated a ${selected.kind} for the ${selected.pkg.toUpperCase()} package and has not ruled it out.`);
  return lines.join(" ");
}

export function buildPassedContext(sources: RetrievedSourceChunk[]): string {
  return sources
    .map((source, index) => `SOURCE ${index + 1}: ${source.title}\nURL: ${source.url}\nCAPTURED: ${source.captureDate}\nCONTENT: ${source.passedText}`)
    .join("\n\n");
}

/** One-line summary of what the agent carried over from the conversation (shown in the trace). */
export function buildMemoryContext(input: { packageContext: PackageContext; convo: ConversationState; resolved: ResolvedQuery; historyLength: number }): string {
  const { packageContext, convo, resolved, historyLength } = input;
  const { focus, selected } = packageContext;
  const parts = [focus ? `Carryover package: ${focus.pkg.toUpperCase()} (${focus.kind})` : "No package context"];
  if (focus && selected && selected !== focus) parts.push(`Stated choice still held: ${selected.pkg.toUpperCase()} (${selected.kind})`);
  if (convo.partySize) parts.push(`Party size: ${convo.partySize}`);
  if (resolved.notes.length) parts.push(`Resolved: ${resolved.notes.join("; ")}`);
  parts.push(`History length: ${historyLength}`);
  return parts.join(" · ");
}

// Each rule is stated once, in the group it belongs to.
const PERSONA = "You are the Greedy Adventures Sea View Skydiving concierge. Write like a knowledgeable, friendly person: plain, specific, calm. No sales hype.";

const GROUNDING_RULES = [
  "Use ONLY the SOURCE EXCERPTS and the VERIFIED DRAFT below. Never invent policies, prices, discounts, refund terms, routes, travel times, availability, safety limits, opening times, media files or booking actions.",
  `If the excerpts do not contain the answer to the WHOLE question, reply with exactly ${NO_INFO_TOKEN} followed by one short sentence saying the information is not available. If only part is covered, answer that part and say plainly what is missing.`,
  "Treat the conversation history as context for what the visitor means, never as a source of facts.",
  "Do not claim to attach or send files; the application attaches media separately. Never say or imply that anything has been booked, reserved or purchased; you cannot take bookings.",
];

const DRAFT_RULES = [
  "Answer EVERY numbered part of the visitor's message, in order, without skipping one. Resolve references such as \"that package\", \"the cheaper one\", \"both of us\" and \"what about VIP?\" using the notes below.",
  "The VERIFIED DRAFT was assembled from the sources and calculated by the application. Rewrite it as a natural reply, and keep everything it says: every section, bullet, list item (including preparation steps and reassurance details), bold lead-in, price, total, calculation, address and phone number, exactly as written. You may tighten the wording, but never drop a point or a list.",
  "Do not do your own arithmetic and do not add a number that is not in the draft or excerpts. Where the draft says something is not stated, say so plainly and do not fill the gap.",
];

const STYLE_RULES = [
  "Start directly with the answer. Never open with a greeting, thanks, a compliment or a remark about the question (no \"Hello\", \"Thank you for your message\", \"Great question\"). Only when the visitor's whole message is just a greeting or thanks, reply in one short, warm sentence.",
  "If the visitor expresses fear or nervousness, acknowledge it in one short sentence first, then give the facts. Reassure first-timers with facts from the sources, not empty encouragement.",
  "Do not end with offers of further help, invitations to ask more, or any generic sign-off. Stop when the answer is complete. Do not repeat the same point twice.",
  "Keep it short: a few short paragraphs, **bold** for package names and totals only, bullets only for a package comparison.",
];

const MEDIA_ONLY_RULE = "The visitor only asked for files, and the application attaches them. Do not state prices or package details and do not start with \"Yes\"; reply with one short sentence.";

export interface PromptInput {
  query: string;
  resolved: ResolvedQuery;
  convo: ConversationState;
  packageContext: PackageContext;
  composition?: Composition;
  mediaOnlyRequest: boolean;
  passedContext: string;
}

export function buildSystemPrompt(input: PromptInput): string {
  const { query, resolved, convo, packageContext, composition, mediaOnlyRequest, passedContext } = input;
  const parts = composition?.parts.length ? composition.parts : [query];
  const draft = composition?.answered
    ? `VERIFIED DRAFT (keep its facts and numbers exactly):\n${renderComposition(composition)}`
    : "VERIFIED DRAFT: none. Answer only from the excerpts, or reply with the no-information token.";

  const context = [
    `PACKAGE CONTEXT: ${describePackageContextForModel(packageContext)}`,
    convo.partySize ? `PARTY SIZE: the visitor is booking for ${convo.partySize} people.` : "",
    resolved.notes.length ? `REFERENCES RESOLVED: ${resolved.notes.join("; ")}. The visitor's message with these resolved reads: "${resolved.text}"` : "",
  ].filter(Boolean);

  return [
    [PERSONA, ...GROUNDING_RULES, ...DRAFT_RULES, ...STYLE_RULES, ...(mediaOnlyRequest ? [MEDIA_ONLY_RULE] : [])].join("\n"),
    context.join("\n"),
    `NUMBERED PARTS OF THE VISITOR'S MESSAGE:\n${parts.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
    draft,
    `SOURCE EXCERPTS:\n${passedContext}`,
  ].join("\n\n");
}

export function buildUserPrompt(history: ChatTurnMessage[], query: string): string {
  return `Conversation so far:\n${history.slice(-8).map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nCurrent question: ${query}`;
}
