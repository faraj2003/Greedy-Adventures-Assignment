export type Pkg = "eco" | "deluxe" | "vip";
export const PACKAGE_ORDER: Pkg[] = ["eco", "deluxe", "vip"];

/** The one canonical casing for a package id is lowercase ("eco" | "deluxe" | "vip"). */
export const isPkg = (value: unknown): value is Pkg => typeof value === "string" && (PACKAGE_ORDER as string[]).includes(value);

/** Accepts any casing ("ECO", "Deluxe", " vip ") and returns the canonical id, or null. */
export function parsePkg(value: unknown): Pkg | null {
  if (typeof value !== "string") return null;
  const id = value.trim().toLowerCase();
  return isPkg(id) ? id : null;
}

const PACKAGE_ALIASES: [RegExp, Pkg][] = [
  [/\b(?:cheapest|cheap (?:option|package|one|jump)|budget (?:option|package|one)|basic (?:option|package|one|jump))\b/gi, "eco"],
  [/\b(?:middle|mid-range|mid range|medium) (?:option|package|one|tier|jump|priced)\b/gi, "deluxe"],
  [/\b(?:most expensive|expensive (?:option|package|one|jump)|premium (?:option|package|one)|top (?:option|package|tier)|most (?:footage|media|coverage))\b/gi, "vip"],
];

export interface PackageMention {
  pkg: Pkg;
  index: number;
  end: number;
}

export function packageMentions(text: string): PackageMention[] {
  const hits: PackageMention[] = [];
  const re = /\b(eco|deluxe|vip)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) hits.push({ pkg: m[1].toLowerCase() as Pkg, index: m.index, end: m.index + m[0].length });
  for (const [pattern, pkg] of PACKAGE_ALIASES) {
    pattern.lastIndex = 0;
    while ((m = pattern.exec(text))) hits.push({ pkg, index: m.index, end: m.index + m[0].length });
  }
  hits.sort((a, b) => a.index - b.index);

  const result: PackageMention[] = [];
  for (const h of hits) {
    const prev = result[result.length - 1];
    if (prev && prev.pkg === h.pkg && h.index < prev.end) continue;
    result.push(h);
  }
  return result;
}

export function mentionedPackages(text: string): Pkg[] {
  const found: Pkg[] = [];
  for (const h of packageMentions(text)) if (!found.includes(h.pkg)) found.push(h.pkg);
  return found;
}

const NEGATION = /(?:\bnot\b|\bnever\b|\bno\b|n't\b(?! mind)|\bskip\b|\bforget\b|\bdrop\b|\bavoid\b|\bwithout\b|\brather than\b|\binstead of\b|\bover\b|\bfrom\b|\bexcept\b|\bother than\b)[^,;.!?]*$/;

const CHOICE_BEFORE = new RegExp(
  [
    String.raw`(?:\bprefer\w*|\bchoose\b|\bchoosing\b|\bchose\b|\bpick(?:ing|ed)?\b|\bselect(?:ing|ed)?\b|\btake\b|`,
    String.raw`\btaking\b|\bgo(?:ing)? with\b|\bgo(?:ing)? for\b|\bopt(?:ing)? for\b|\bsettle[sd]? (?:on|for)\b|`,
    String.raw`\bswitch(?:ed|ing)?\b[^,;.!?]*\bto\b|\bchang(?:e|ed|ing)\b[^,;.!?]*\bto\b|\bswap(?:ped|`,
    String.raw`ping)?\b[^,;.!?]*\bto\b|\bmove[sd]?\b[^,;.!?]*\bto\b|\b(?:up|down)grade\b[^,;.!?]*\bto\b|`,
    String.raw`\bbook(?:ing)?\b|\bwant\b|\bwould like\b|\bi'?d like\b|\blet's (?:do|go)\b|\bi'?ll (?:have|do|`,
    String.raw`take)\b|\bi'?d rather(?! not)\b)[^,;.!?]*$`,
  ].join(""),
);

const CHOICE_AFTER = /^\s*(?:instead|please|then|for me|it is|it'?s my choice)\b/;

const COMPARISON_CUE = /\b(?:differences?|compare[ds]?|comparison|versus|vs\.?|between|which|should i|better|worse|than|worth|or|and)\b/;

export type PackageStatementKind = "reference" | "preference" | "selection" | "comparison" | "rejection" | "none";

export interface PackageStatement {
  kind: PackageStatementKind;

  pkg: Pkg | null;

  rejected: Pkg[];
}

const EVALUATIVE_CUE = /\b(?:better|best|worse|worth|should i|good value|recommend\w*)\b/;

const SELECTION_CUE = new RegExp(
  [
    String.raw`\b(?:go(?:ing)? with|go(?:ing)? for|opt(?:ing)? for|settle[sd]? (?:on|for)|choose|choosing|chose|`,
    String.raw`pick(?:ing|ed)?|select(?:ing|ed)?|book(?:ing)?|take|taking|let's (?:do|go)|i'?ll (?:have|do|take)|`,
    String.raw`switch(?:ed|ing)?|chang(?:e|ed|ing)|swap(?:ped|ping)?|move[sd]?|(?:up|down)grade)\b`,
  ].join(""),
);

type Role = "chosen" | "negated" | "neutral";

function roleOf(sentence: string, mention: PackageMention, previous: PackageMention | undefined): Role {
  const clauseStart = Math.max(sentence.lastIndexOf(",", mention.index - 1), sentence.lastIndexOf(":", mention.index - 1)) + 1;
  const since = Math.max(clauseStart, previous ? previous.end : 0);
  if (NEGATION.test(sentence.slice(since, mention.index))) return "negated";
  if (CHOICE_BEFORE.test(sentence.slice(clauseStart, mention.index)) || CHOICE_AFTER.test(sentence.slice(mention.end))) return "chosen";
  return "neutral";
}

const NONE: PackageStatement = { kind: "none", pkg: null, rejected: [] };

const QUESTION_START = new RegExp(
  [
    String.raw`^\s*(?:(?:and|so|but|also|okay|ok|well|hey|hi|then)\b[ ,]*)*(?:(?:can|could|will|do|does|did|is|are|`,
    String.raw`am|should|may|might|what|which|how|when|where|why|who|whether|if|suppose|imagine)\b|`,
    String.raw`would\b(?! (?:like|love|rather|prefer)))`,
  ].join(""),
);
function isQuestion(sentence: string): boolean {
  return QUESTION_START.test(sentence);
}

function decisionKind(sentence: string): "selection" | "preference" {
  return SELECTION_CUE.test(sentence) ? "selection" : "preference";
}

function classifySentence(rawSentence: string): PackageStatement {
  const sentence = rawSentence.toLowerCase();
  const mentions = packageMentions(sentence);
  if (!mentions.length) return NONE;

  const roles = new Map<Pkg, Role>();
  mentions.forEach((m, i) => {
    const role = roleOf(sentence, m, mentions[i - 1]);
    const existing = roles.get(m.pkg);

    if (existing === "negated" || role === "negated") roles.set(m.pkg, "negated");
    else if (existing === "chosen" || role === "chosen") roles.set(m.pkg, "chosen");
    else roles.set(m.pkg, "neutral");
  });

  const chosen = [...roles].filter(([, r]) => r === "chosen").map(([p]) => p);
  const negated = [...roles].filter(([, r]) => r === "negated").map(([p]) => p);
  const neutral = [...roles].filter(([, r]) => r === "neutral").map(([p]) => p);

  const asking = isQuestion(sentence);
  const decision = (pkg: Pkg): PackageStatement =>
    asking ? { kind: "reference", pkg, rejected: negated } : { kind: decisionKind(sentence), pkg, rejected: negated };

  if (roles.size === 1) {
    const [only, role] = [...roles][0];

    if (role === "negated") return { kind: "rejection", pkg: null, rejected: [only] };
    if (role === "chosen") return decision(only);
    if (EVALUATIVE_CUE.test(sentence)) return { kind: "comparison", pkg: null, rejected: [] };
    return { kind: "reference", pkg: only, rejected: [] };
  }

  if (!negated.length && COMPARISON_CUE.test(sentence)) return { kind: "comparison", pkg: null, rejected: [] };
  if (chosen.length === 1) return decision(chosen[0]);
  if (!chosen.length && neutral.length === 1 && negated.length) return decision(neutral[0]);
  if (negated.length && !chosen.length) return { kind: "rejection", pkg: null, rejected: negated };
  return NONE;
}

export function classifyPackageMessage(text: string): PackageStatement {
  const normalized = text.replace(/[’‘]/g, "'");
  let kind: PackageStatementKind = "none";
  let pkg: Pkg | null = null;
  const rejected = new Set<Pkg>();
  for (const sentence of normalized.split(/(?<=[.!?;])\s+|\n+/)) {
    const statement = classifySentence(sentence);
    if (statement.kind !== "none") kind = statement.kind;
    if (statement.pkg) pkg = statement.pkg;
    for (const r of statement.rejected) rejected.add(r);

    if (statement.pkg) rejected.delete(statement.pkg);
  }
  return { kind, pkg, rejected: [...rejected] };
}

export function resolvePackageChoice(text: string): Pkg | null {
  return classifyPackageMessage(text).pkg;
}

export type PackageContextStatement = PackageStatement & { pkg: Pkg };
export interface PackageContext {
  focus: PackageContextStatement | null;
  selected: PackageContextStatement | null;
}

export function resolvePackageContext(userMessages: string[]): PackageContext {
  let focus: PackageContextStatement | null = null;
  let selected: PackageContextStatement | null = null;
  const rejectedLater = new Set<Pkg>();
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const statement = classifyPackageMessage(userMessages[i]);
    if (statement.pkg && !rejectedLater.has(statement.pkg)) {
      const withPkg = statement as PackageContextStatement;
      if (!focus) focus = withPkg;
      if (!selected && (statement.kind === "selection" || statement.kind === "preference")) selected = withPkg;
    }
    for (const r of statement.rejected) rejectedLater.add(r);
    if (focus && selected) break;
  }
  return { focus, selected };
}
