import { KNOWLEDGE_SOURCES } from "./knowledge";

/* ------------------------------------------------------------------ */
/* English-only handling                                               */
/* ------------------------------------------------------------------ */

/**
 * True when the message is mostly written in a non-Latin script (Thai, Chinese, Arabic, Cyrillic, ...).
 * The knowledge base is English only, so these messages get a clear "English only" reply instead of a
 * misleading "I can't find that" answer. A message that is mostly Latin letters (for example
 * "ราคา VIP" is NOT, but "What does สกายไดฟ์ mean?" is) is left alone.
 */
export function isMostlyNonEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return false;
  const latin = letters.filter((ch) => /[A-Za-z\u00C0-\u024F]/.test(ch)).length;
  const other = letters.length - latin;
  return other >= 2 && other / letters.length >= 0.4;
}

export const ENGLISH_ONLY_MESSAGE =
  "Sorry, I can only answer in English at the moment, so I can't read that message. " +
  "Please ask again in English, for example “How much is VIP?” or “Where is the dropzone?”. " +
  "The Greedy Adventures team can also help you directly.";

/* ------------------------------------------------------------------ */
/* Small talk                                                          */
/* ------------------------------------------------------------------ */

export type SmallTalk = "greeting" | "thanks" | "goodbye" | null;

const THANKS = /^\s*(?:(?:ok(?:ay)?|great|cool|perfect|awesome|nice|got it|alright|cheers|wonderful|brilliant)[\s,!.]*)*(?:thanks?|thank you|thank u|thx|ty|cheers|much appreciated|appreciate it|appreciated)(?:\s+(?:so|very))?(?:\s+(?:much|a lot|a bunch))?(?:\s+(?:for (?:the )?(?:help|info|information|answers?|reply)|again|mate|a lot))?[\s!.,:)]*(?:👍|🙏|😊|🙂)?\s*$/i;
const ACK = /^\s*(?:ok(?:ay)?|okey|great|cool|perfect|awesome|nice|got it|alright|sounds good|understood|noted|i see|makes sense|good to know)[\s!.,:)]*$/i;
const GOODBYE = /^\s*(?:(?:ok(?:ay)?|great|cool|thanks?|thank you)[\s,!.]*)*(?:bye(?:[- ]?bye)?|goodbye|see you(?: later| soon)?|that'?s all|that is all|that'?s it|nothing else|no(?:,? thanks?| thank you)?|i'?m good|all good|all set)[\s!.,:)]*$/i;
const GREETING = /^\s*(?:hi+|hello+|hey+|hiya|howdy|greetings|yo|sawasdee(?: krub| ka)?|good (?:morning|afternoon|evening)|hi there|hello there|hey there)[\s!.,?:)]*$/i;

export function classifySmallTalk(query: string): SmallTalk {
  const q = query.replace(/[’‘]/g, "'");
  if (THANKS.test(q) || ACK.test(q)) return "thanks";
  if (GOODBYE.test(q)) return "goodbye";
  if (GREETING.test(q)) return "greeting";
  return null;
}

export function smallTalkReply(kind: Exclude<SmallTalk, null>): string {
  switch (kind) {
    case "thanks":
      return "You're welcome! If you think of anything else about Sea View Skydiving, just ask.";
    case "goodbye":
      return "Thanks for stopping by. Come back any time if you have more questions about Sea View Skydiving.";
    default:
      return "Hello! I can help with the Sea View Skydiving packages, what each includes, the location, jump timings, the brochure or a preview video. What would you like to know?";
  }
}

/* ------------------------------------------------------------------ */
/* Typo tolerance                                                      */
/* ------------------------------------------------------------------ */

// Chat shorthand and very common typos that are too short for edit-distance matching.
const SHORTHAND: Record<string, string> = {
  wat: "what", wht: "what", whats: "what's", hw: "how", hou: "how", wen: "when", wer: "where", whre: "where",
  pls: "please", plz: "please", thx: "thanks", abt: "about", ur: "your", u: "you", r: "are", cn: "can",
  teh: "the", adn: "and", hte: "the", jmp: "jump", prise: "price", cheep: "cheap", vidio: "video", viedo: "video",
};

// Core words the answer logic keys on. Prefix truncations ("pric") are only expanded to these.
const CORE_TERMS = [
  "price", "prices", "cost", "package", "packages", "brochure", "video", "photos", "photo", "include", "includes",
  "included", "location", "address", "directions", "pickup", "weight", "height", "altitude", "duration", "minimum",
  "cheapest", "expensive", "compare", "difference", "booking", "book", "deluxe", "bangkok", "pattaya", "freefall",
  "canopy", "safety", "medical", "health", "fitness", "total", "discount", "refund", "cancel", "payment", "weather",
  "camera", "cameraman", "instructor", "certificate", "experience", "skydive", "skydiving", "tandem", "available",
];

// Everyday English the knowledge base may not contain; these are never "corrected".
const COMMON = new Set(
  (
    "about above after again against all also always am an and any are around as ask at be because been before being " +
    "below between both but by can cannot could did do does doing done down during each either else even ever every " +
    "few for from further get gets getting give go goes going gone good got great had has have having he her here hers " +
    "him his how however i if in into is it its just kid kids know less let like little long look made make many may " +
    "maybe me more most much must my need needs never new next no nor not now of off often ok okay old on once one only " +
    "or other our out over own part people please really same say see seem she should show since so some something " +
    "such sure take tell than thank thanks that the their them then there these they thing think this those though " +
    "through time to too under until up upon us use used very want wants was way we well went were what when where " +
    "whether which while who whom whose why will with without won would yes yet you your yours " +
    "wife husband partner friend friends family mother father mum mom dad son daughter brother sister child children " +
    "baby girl boy man woman old young year years month months week weeks day days hour hours minute minutes second " +
    "seconds today tomorrow tonight morning evening afternoon night monday tuesday wednesday thursday friday saturday sunday " +
    "wing wings wind winds ride rides fly flying flight flights sky jump jumps jumped jumping dive diving drive driving " +
    "hotel hotels beach beaches sea ocean water swim swimming boat boats bike bikes car cars bus taxi train tour tours trip " +
    "trips visit visiting travel travelling traveling holiday vacation weekend gift gifts voucher birthday wedding honeymoon " +
    "anniversary proposal surprise fun scary safe safer dangerous danger risk risks fear afraid scared nervous excited " +
    "heavy light tall short big small large fat thin slim healthy sick ill pain painful back knee knees leg legs arm arms " +
    "neck head heart lung lungs bone bones glasses contact lenses shoes sandals shorts shirt dress jewelry " +
    "english thai thailand india indian hindi chinese russian german french spanish japanese korean language languages " +
    "speak speaks spoken translate translation hello hi hey bye goodbye cheers yoga gym sport sports exercise run running " +
    "walk walking climb climbing stairs lift carry bag bags phone phones laptop wallet money cash card cards baht dollar " +
    "dollars euro euros pound pounds rupee rupees tip tips free paid pay paying cheap cheaper expensive pricey worth " +
    "wait waiting late early soon again anyway actually maybe probably possible impossible allowed able unable ready " +
    "zorb zip line bungee scuba paragliding snowboarding wingsuit helicopter"
  )
    .split(/\s+/)
    .filter(Boolean),
);

let vocabCache: Set<string> | null = null;
function vocabulary(): Set<string> {
  if (vocabCache) return vocabCache;
  const vocab = new Set<string>(CORE_TERMS);
  for (const source of KNOWLEDGE_SOURCES) {
    for (const word of source.text.toLowerCase().match(/[a-z]{4,}/g) ?? []) vocab.add(word);
  }
  vocabCache = vocab;
  return vocab;
}

/** Optimal-string-alignment distance (insert, delete, substitute, swap neighbouring letters). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => [i, ...new Array<number>(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[rows - 1][cols - 1];
}

function correctWord(word: string): string | null {
  const w = word.toLowerCase();
  if (SHORTHAND[w]) return SHORTHAND[w];
  if (w.length < 4 || COMMON.has(w)) return null;
  const vocab = vocabulary();
  if (vocab.has(w)) return null;

  // 1. Truncated word ("pric" -> "price"): only expand to a core term.
  if (w.length >= 4) {
    const expansions = CORE_TERMS.filter((t) => t.startsWith(w) && t.length - w.length <= 3);
    if (expansions.length) return expansions.sort((x, y) => x.length - y.length)[0];
  }

  // 2. Misspelling: closest word at distance 1 (distance 2 for long words). Core terms win ties.
  const limit = w.length >= 8 ? 2 : 1;
  let best: { word: string; dist: number; core: boolean } | null = null;
  let tied = false;
  const coreSet = new Set(CORE_TERMS);
  const consider = (candidate: string) => {
    if (Math.abs(candidate.length - w.length) > limit) return;
    // Four-letter words only match core terms or a swapped pair, so real short words are left alone.
    if (w.length === 4 && !coreSet.has(candidate) && editDistance(w, candidate) !== 1) return;
    const dist = editDistance(w, candidate);
    if (dist === 0 || dist > limit) return;
    const core = coreSet.has(candidate);
    if (!best || dist < best.dist || (dist === best.dist && core && !best.core)) {
      best = { word: candidate, dist, core };
      tied = false;
    } else if (dist === best.dist && core === best.core && candidate !== best.word) {
      tied = true;
    }
  };
  for (const candidate of CORE_TERMS) consider(candidate);
  if (w.length >= 5) for (const candidate of vocab) consider(candidate);
  const found = best as { word: string; dist: number; core: boolean } | null;
  if (!found || (tied && !found.core)) return null;
  return found.word;
}

export interface TypoResult {
  text: string;
  changes: { from: string; to: string }[];
}

/** Fixes likely typos word by word. Numbers, prices and short words are never touched. */
export function correctTypos(query: string): TypoResult {
  const changes: { from: string; to: string }[] = [];
  const text = query.replace(/[A-Za-z']+/g, (word) => {
    if (/^[A-Z]{2,}$/.test(word)) return word;
    const fixed = correctWord(word);
    if (!fixed || fixed === word.toLowerCase()) return word;
    changes.push({ from: word, to: fixed });
    return /^[A-Z]/.test(word) ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed;
  });
  return { text, changes };
}
