import { Composition, renderComposition } from "./compose";
import { knownBahtAmounts } from "./facts";
import { GENERIC_UNAVAILABLE } from "./guardrails";
import { NO_INFO_TOKEN } from "./prompt";

export function stripGenericOpening(text: string, query: string): string {
  if (/^\s*(hi|hello|hey|thanks|thank you|good (morning|afternoon|evening))\b[\s!.,]*$/i.test(query)) return text;
  const opening = /^\s*(?:(?:hello|hi|hey|greetings)\b[^.!?\n]*[.!?]\s*)?(?:thank(?:s| you)(?: so much)?(?: very much)? for (?:your|the) (?:message|question|inquiry|enquiry|interest|reaching out)[^.!?\n]*[.!?]\s*)?/i;
  let next = text.replace(opening, "").trimStart();
  const filler = new RegExp(
    [
      String.raw`^(?:(?:that'?s |what )?(?:a |an )?(?:great|good|excellent|fantastic|lovely) (?:question|`,
      String.raw`choice)[^.!?\n]*[.!?]\s*|thanks? (?:for (?:asking|reaching out|getting in touch)|`,
      String.raw`so much)[^.!?\n]*[.!?]\s*|i (?:completely |totally )?understand (?:your|that|`,
      String.raw`how)[^.!?\n]*[.!?]\s*|i'?m (?:so )?sorry to hear[^.!?\n]*[.!?]\s*|absolutely[!.]\s*|`,
      String.raw`certainly[!.]\s*|of course[!.]\s*|sure[!.]\s*)+`,
    ].join(""),
    "i",
  );
  next = next.replace(filler, "");
  return next && next !== text ? next.charAt(0).toUpperCase() + next.slice(1) : text;
}

const keyFiguresOf = (draft: string): string[] => {
  const figures = [...draft.matchAll(/฿\s*[\d,]+/g)].map((m) => m[0].replace(/\s+/g, ""));
  const extras = [/\+\d[\d ]{8,}\d/, /95 M\.4/].map((re) => re.exec(draft)?.[0]).filter((x): x is string => Boolean(x));
  return [...new Set([...figures, ...extras])];
};

export function dropsVerifiedContent(answer: string, draft: string): boolean {
  const flat = answer.replace(/\s+/g, "");
  if (keyFiguresOf(draft).some((f) => !flat.includes(f.replace(/\s+/g, "")))) return true;
  const listLines = draft.split("\n").filter((l) => /^\s*(?:[-•]|\d+[.)])\s/.test(l)).length;
  const answerLists = answer.split("\n").filter((l) => /^\s*(?:[-•*]|\d+[.)])\s/.test(l)).length;
  if (listLines >= 3 && answerLists < listLines - 1) return true;
  return answer.length < draft.length * 0.55;
}

export function stripGenericEnding(text: string): string {
  const ending = new RegExp(
    [
      String.raw`(?:^|\n+|(?<=[.!?])\s+)(?:[^\n.!?]*\b(?:let me know|feel free|don'?t hesitate|happy to help|`,
      String.raw`hope this helps|is there anything else|anything else (?:i|you)|any other questions|`,
      String.raw`any more questions|if you (?:have|need) (?:any|more)|i'?m here (?:to|if))\b[^\n]*)\s*$`,
    ].join(""),
    "i",
  );
  let out = text.trimEnd();
  for (let i = 0; i < 2; i++) {
    const next = out.replace(ending, "").trimEnd();
    if (next === out || !next) break;
    out = next;
  }
  return out;
}

export function unverifiedBaht(text: string, query: string, composition: Composition): number[] {
  const allowed = knownBahtAmounts();
  for (const n of composition.figures) allowed.add(n);
  for (const m of query.matchAll(/฿\s*([\d,]+)/g)) allowed.add(Number(m[1].replace(/,/g, "")));
  const bad: number[] = [];
  for (const m of text.matchAll(/฿\s*([\d,]+)/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (!allowed.has(n)) bad.push(n);
  }
  return bad;
}

export interface ModelReply {
  answer: string;
  /** The model said the excerpts do not contain the answer. */
  noInfo: boolean;
  /** Extra router-reason text describing what was corrected. */
  note: string;
}

/**
 * Cleans a raw model reply and checks it against the verified draft: a reply that drops
 * verified content or introduces an unverified amount is replaced by the draft itself.
 */
export function interpretModelReply(raw: string, query: string, composition: Composition | undefined): ModelReply {
  let answer = stripGenericOpening(stripGenericEnding(raw), query);
  let note = "";
  if (composition?.answered && !answer.startsWith(NO_INFO_TOKEN)) {
    const bad = unverifiedBaht(answer, query, composition);
    const draft = renderComposition(composition);
    if (!bad.length && dropsVerifiedContent(answer, draft)) {
      note = " · Model output left out verified content; the verified draft was returned instead.";
      answer = draft;
    } else if (bad.length) {
      note = ` · Model output contained unverified amounts (${bad.map((n) => `฿${n}`).join(", ")}); the verified draft was returned instead.`;
      answer = draft;
    } else {
      for (const calc of composition.calcs) {
        const total = calc.split("= ").pop() ?? "";
        if (total && !answer.includes(total)) answer += `\n\n${calc}`;
      }
    }
  }
  if (answer.startsWith(NO_INFO_TOKEN)) {
    return { answer: answer.slice(NO_INFO_TOKEN.length).trim() || GENERIC_UNAVAILABLE, noInfo: true, note: `${note} · The model reported that the retrieved excerpts do not contain the answer.` };
  }
  return { answer, noInfo: false, note };
}
