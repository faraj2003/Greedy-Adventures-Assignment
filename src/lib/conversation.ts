import { baht, LABEL, OrderLine, priceOf } from "./facts";
import { detectIntents, Intent } from "./intents";
import { mentionedPackages, PACKAGE_ORDER, Pkg, resolvePackageContext, PackageContext } from "./packages";
import { ChatTurnMessage } from "./types";

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, pair: 2 };
const NUM = "(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)";
const toNum = (s: string): number => (/^\d+$/.test(s) ? Number(s) : NUMBER_WORDS[s.toLowerCase()] ?? 0);

const normalize = (q: string): string => q.replace(/[’‘]/g, "'").toLowerCase();

export function partySizeOf(text: string): number | null {
  const t = normalize(text);
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`\\b(?:party|group) of ${NUM}\\b`).exec(t))) return toNum(m[1]);
  if ((m = new RegExp(`\\b${NUM} (?:of us|people|persons?|jumpers?|passengers?|guests|pax|adults|friends)\\b`).exec(t))) return toNum(m[1]);
  if ((m = new RegExp(`\\bwe(?:'re| are) ${NUM}\\b`).exec(t))) return toNum(m[1]);
  if ((m = new RegExp(`\\bfor ${NUM}(?: people| persons?| of us)?\\b(?! (?:hours?|minutes?|days?))`).exec(t))) return toNum(m[1]);
  if (
    new RegExp(
      [
        String.raw`\b(both of us|the two of us|us two|us both|we both|for both|my (?:friend|wife|husband|partner|`,
        String.raw`girlfriend|boyfriend|brother|sister|mum|mom|dad|son|daughter) and (?:i|me)|me and my (?:friend|`,
        String.raw`wife|husband|partner|girlfriend|boyfriend|brother|sister)|(?:with|bringing|coming with|`,
        String.raw`joining me)[^.?!]{0,12}\b(?:my )?(?:friend|wife|husband|partner|girlfriend|boyfriend|brother|`,
        String.raw`sister)\b|a couple|couple of us)\b`,
      ].join(""),
    ).test(t)
  )
    return 2;
  return null;
}

const COMPANION = "friend|wife|husband|partner|girlfriend|boyfriend|fianc[eé]e?|brother|sister|mum|mom|dad|son|daughter|colleague|cousin|mate";

/**
 * People added to the party by a follow-up such as "and for my wife too?", "plus my friend" or "2 more people".
 * Returns null when the message does not add anyone (or adds an unknown number, such as "my kids").
 */
export function addedPeopleOf(text: string): number | null {
  const t = normalize(text);
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`\\b${NUM} more(?: (?:people|persons?|friends|guests|adults|jumpers?|of us))?\\b`).exec(t))) return toNum(m[1]) || null;
  if (new RegExp(`\\b(?:for|and|plus|with|also|what about|how about)\\s+(?:my|our)\\s+(?:${COMPANION})\\b[^.?!]{0,20}\\b(?:too|also|as well|included)\\b`).test(t)) return 1;
  if (new RegExp(`^\\s*(?:and|also|plus|what about|how about)\\s+(?:for\\s+)?(?:my|our)\\s+(?:${COMPANION})\\s*[?.!]*\\s*$`).test(t)) return 1;
  if (new RegExp(`\\b(?:add|include)\\s+(?:my|our)\\s+(?:${COMPANION})\\b`).test(t)) return 1;
  return null;
}

export function orderLinesOf(text: string): OrderLine[] {
  const t = normalize(text);
  const lines: OrderLine[] = [];
  const re = new RegExp(`\\b${NUM}\\s*(?:x|×|\\*)?\\s*(?:of\\s+)?(?:the\\s+)?(eco|deluxe|vip)\\b`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) lines.push({ qty: toNum(m[1]), pkg: m[2] as Pkg });
  return lines.filter((l) => l.qty > 0);
}

export function budgetOf(text: string): { amount: number; perPerson: boolean; total: boolean } | null {
  const t = normalize(text);
  const m = /(?:฿\s?([\d,]{4,7})|\b([\d,]{4,7})\s?(?:baht|thb)\b|\b(\d{1,3})\s?k\b(?:\s?baht)?)/.exec(t);
  if (!m) return null;
  const amount = m[1] ? Number(m[1].replace(/,/g, "")) : m[2] ? Number(m[2].replace(/,/g, "")) : Number(m[3]) * 1000;
  if (!amount) return null;
  return { amount, perPerson: /\b(each|per person|per head|pp|a head|apiece)\b/.test(t), total: /\b(total|altogether|combined|in all|between us|for both|for all)\b/.test(t) };
}

export interface ConversationState {
  packages: PackageContext;
  partySize: number | null;

  recent: Pkg[];

  previousIntents: Intent[];
  previousUserText: string | null;
}

export function deriveState(history: ChatTurnMessage[]): ConversationState {
  const users = history.filter((m) => m.role === "user").map((m) => m.content);
  let partySize: number | null = null;
  for (const u of users) {
    const p = partySizeOf(u);
    const added = addedPeopleOf(u);
    if (p) partySize = p;
    else if (added) partySize = (partySize ?? 1) + added;
  }
  const recent: Pkg[] = [];
  for (let i = users.length - 1; i >= 0 && recent.length < 2; i--) {
    for (const p of mentionedPackages(users[i])) if (!recent.includes(p)) recent.push(p);
    if (recent.length) break;
  }
  if (recent.length < 2) {
    const lastAssistant = [...history].reverse().find((m) => m.role === "assistant")?.content ?? "";
    for (const p of mentionedPackages(lastAssistant)) if (!recent.includes(p)) recent.push(p);
  }
  const previousUserText = users.length ? users[users.length - 1] : null;
  return {
    packages: resolvePackageContext(users),
    partySize,
    recent,
    previousIntents: previousUserText ? detectIntents(previousUserText) : [],
    previousUserText,
  };
}

const byPrice = (pkgs: Pkg[]): Pkg[] => [...pkgs].sort((a, b) => (priceOf(a) ?? 0) - (priceOf(b) ?? 0));

export interface ResolvedQuery {
  text: string;

  notes: string[];
  partySize: number | null;

  inherited: boolean;
  packages: Pkg[];

  addedPeople: number | null;
}

export function resolveQuery(query: string, state: ConversationState): ResolvedQuery {
  let text = query.replace(/[’‘]/g, "'");
  const notes: string[] = [];
  const focus = state.packages.focus?.pkg ?? null;
  const pool = state.recent.length ? state.recent : focus ? [focus] : [];
  const sorted = byPrice(pool);

  const replace = (pattern: RegExp, pkg: Pkg | null, why: string) => {
    if (!pkg || !pattern.test(text)) return;
    text = text.replace(pattern, LABEL[pkg]);
    notes.push(`${why} → ${LABEL[pkg]}`);
  };

  const cheaper = (): Pkg | null => {
    if (sorted.length >= 2) return sorted[0];
    const base = sorted[0] ?? null;
    if (!base) return PACKAGE_ORDER[0];
    const idx = PACKAGE_ORDER.indexOf(base);
    return idx > 0 ? PACKAGE_ORDER[idx - 1] : base;
  };
  const pricier = (): Pkg | null => {
    if (sorted.length >= 2) return sorted[sorted.length - 1];
    const base = sorted[0] ?? null;
    if (!base) return PACKAGE_ORDER[PACKAGE_ORDER.length - 1];
    const idx = PACKAGE_ORDER.indexOf(base);
    return idx < PACKAGE_ORDER.length - 1 ? PACKAGE_ORDER[idx + 1] : base;
  };

  replace(/\b(?:the )?(?:top|best|premium|highest|fanciest|most expensive|priciest)(?: one| option| package| tier| level)\b|\bthe top\b/i, PACKAGE_ORDER[PACKAGE_ORDER.length - 1], "“the top one”");
  replace(/\b(?:the )?(?:one in the middle|middle one|middle option|middle package|mid[- ]?range(?: one| option| package)?|in[- ]between one)\b/i, PACKAGE_ORDER[1], "“the middle one”");
  replace(/\b(?:the )?(?:cheapest|most basic|lowest[- ]priced|bottom)(?: one| option| package| tier)?\b|\b(?:the )?basic (?:one|option|package)\b/i, PACKAGE_ORDER[0], "“the cheapest one”");
  replace(/\b(?:the )?(?:cheaper|less expensive|lower[- ]priced|more affordable)(?: one| option| package| of the two)?\b/i, cheaper(), "“the cheaper one”");
  replace(/\b(?:the )?(?:more expensive|pricier|costlier|higher[- ]priced|better|fancier)(?: one| option| package| of the two)\b/i, pricier(), "“the more expensive one”");
  replace(/\b(?:that|this|the same|the chosen|my) (?:package|option|tier)\b|\bthat one\b|\bthis one\b/i, focus, "“that package”");

  let partySize = partySizeOf(query);
  const addedPeople = addedPeopleOf(query);
  if (partySize) notes.push(`party size ${partySize}`);
  else if (addedPeople) {
    partySize = (state.partySize ?? 1) + addedPeople;
    notes.push(`follow-up adds ${addedPeople} more ${addedPeople === 1 ? "person" : "people"} → party size ${partySize}`);
  } else if (state.partySize) {
    partySize = state.partySize;
    if (/\b(both|the two|all of us|each|everyone|the group|we|us)\b/i.test(query) || /\b(total|altogether)\b/i.test(query)) notes.push(`party size ${partySize} (from earlier in the chat)`);
    else partySize = null;
  }

  let inherited = false;
  const short = text.trim().split(/\s+/).length <= 8;
  const named = mentionedPackages(text);
  if (short && named.length >= 1 && /^\s*(?:and\s+|so\s+|ok(?:ay)?,?\s+)?(?:what|how) about\b|^\s*and\b/i.test(text) && state.previousUserText) {
    const prior = detectIntents(state.previousUserText);
    if (prior.length) {
      inherited = true;
      notes.push(`follow-up repeats the previous question (${prior.join(", ")}) for ${named.map((p) => LABEL[p]).join(" / ")}`);
    }
  }
  return { text, notes, partySize, inherited, packages: mentionedPackages(text), addedPeople };
}

export function effectiveIntents(resolved: ResolvedQuery, state: ConversationState, own: Intent[]): Intent[] {
  if (!resolved.inherited) return own;
  const merged = new Set<Intent>(own);
  for (const i of state.previousIntents) merged.add(i);
  return [...merged];
}

export const describeBudget = (amount: number): string => baht(amount);
