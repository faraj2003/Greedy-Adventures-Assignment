import { budgetOf, ConversationState, effectiveIntents, orderLinesOf, partySizeOf, ResolvedQuery } from "./conversation";
import {
  baht, blockLines, computeTotal, dropzoneAddress, findSentence, hasFact, LABEL, packageFacts, packageHasMedia, packageSummary, planSteps,
  priceOf, pricesKnown, sourceBlock, whatsappNumber,
} from "./facts";
import { CAPABILITY_HINT, checkRestrictedTopic, refusalFor } from "./guardrails";
import { Intent, mediaNeeds, mentionsOrigin, QuestionPart, questionsOf } from "./intents";
import { topicOf } from "./patterns";
import { mentionedPackages, PACKAGE_ORDER, Pkg } from "./packages";

export interface Section {
  key: string;
  heading: string;
  text: string;
  answered: boolean;
}

export interface Composition {
  sections: Section[];

  calcs: string[];

  figures: number[];

  parts: string[];
  answered: boolean;
}

const list = (items: string[]): string => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
const sentence = (s: string): string => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

const asTeam = (): string => TEAM().replace(/^the /, "The ");
const TEAM = (): string => {
  const n = whatsappNumber();
  return n ? `the team on WhatsApp (${n})` : "the Greedy Adventures team";
};

interface Ctx {
  state: ConversationState;
  resolved: ResolvedQuery;
  text: string;
  intents: Intent[];
  calcs: string[];
  figures: number[];
}

const gap = (a: Pkg, b: Pkg): number | null => (priceOf(a) !== null && priceOf(b) !== null ? priceOf(a)! - priceOf(b)! : null);

function contextPackages(ctx: Ctx, named: Pkg[]): Pkg[] {
  if (named.length) return named;
  const f = ctx.state.packages.focus?.pkg ?? ctx.state.packages.selected?.pkg;
  return f ? [f] : [];
}

function transport(ctx: Ctx): string | null {
  if (!hasFact("95 M.4")) return null;
  const out: string[] = [];
  const origin = mentionsOrigin(ctx.text);
  out.push(`The dropzone is run by Dropzone Thailand at **${dropzoneAddress()}**. It is marketed as Sea View Skydiving over the Gulf of Thailand, near Pattaya.`);
  if (hasFact("bangkok pickup")) {
    const fromBangkok = origin && /bangkok|bkk|suvarnabhumi|don mueang/.test(origin);
    out.push(
      `${fromBangkok ? "Since you're starting from Bangkok, the option I can point to is the" : "There is a"}` +
        ` **Bangkok pickup add-on, available at a fixed price**. The price isn't published in ` +
        `the sources I have, so ask for it when you book. The booking form also asks for your ` +
        `pickup time and your hotel or pickup location, and the team confirms by WhatsApp.`,
    );
  }
  out.push(
    `The sources don't give driving routes, public-transport or taxi options, fares or travel ` +
      `times, so I can't recommend a route or say how long the trip takes. For that, the address ` +
      `above is what to use in a maps app, and ${TEAM()} can advise.`,
  );
  return out.join("\n\n");
}

function jointBooking(): string | null {
  if (!hasFact("more than one passenger")) return null;
  const fields = blockLines("src-booking-page", "The booking request asks for");
  const perPerson = fields.filter((f) => /full name|^age|weight|passport photo/i.test(f)).map((f) => lower(f.replace(/\.$/, "").replace(/^passenger /i, "")));
  return (
    `The booking form lets you **add more than one passenger** to a single request` +
    `${perPerson.length ? `, so you don't have to book one by one. It asks for each passenger's ${list(perPerson)}` : ""}` +
    `. Submitting it sends a request, and the team confirms availability by WhatsApp, so ` +
    `nothing is confirmed until they reply.\n\nThe sources don't say whether each passenger on ` +
    `one request can choose a different package, or whether the team prefers separate ` +
    `requests. If that matters, check with ${TEAM()}.`
  );
}

function combinedMedia(): string {
  const handover = sourceBlock("src-terms", "Media");
  return (
    `The sources describe media **per person and per package**: ECO has none, DELUXE gives ` +
    `handycam video and photos, and VIP gives a personal cameraman with photos and an edited ` +
    `film. They don't mention merging two people's footage into one shared video, so I can't ` +
    `promise that.` +
    `${handover ? ` What they do say: ${lower(handover.replace(/\.$/, ""))}.` : ""} If a ` +
    `single combined video matters to you, ask ${TEAM()} before booking.`
  );
}

function totals(ctx: Ctx, named: Pkg[]): string | null {
  if (!pricesKnown()) return null;
  const party = ctx.resolved.partySize;
  const explicit = orderLinesOf(ctx.text);
  const run = (items: { pkg: Pkg; qty: number }[]): string | null => {
    const t = computeTotal(items);
    if (!t) return null;
    ctx.calcs.push(t.text);
    ctx.figures.push(t.total, ...t.lines.map((l) => l.subtotal));
    return t.text;
  };
  const note = "Prices are per person. The Bangkok pickup add-on isn't included because its price isn't stated.";
  if (explicit.length) {
    const t = run(explicit);
    return t ? `That comes to **${t}**. ${note}` : null;
  }
  const pkgs = contextPackages(ctx, named);
  if (party && party > 1 && pkgs.length === 1) {
    const t = run([{ pkg: pkgs[0], qty: party }]);
    return t ? `For ${party} people on ${LABEL[pkgs[0]]}: **${t}**. ${note}` : null;
  }
  if (party && party > 1) {
    const targets = pkgs.length ? pkgs : PACKAGE_ORDER;
    const rows = targets.map((p) => `- **${LABEL[p]}**: ${run([{ pkg: p, qty: party }])}`);
    return `For ${party} people, the totals are:\n\n${rows.join("\n")}\n\n${note}`;
  }
  const targets = pkgs.length ? pkgs : PACKAGE_ORDER;
  return `${list(targets.map((p) => `**${LABEL[p]}** is ${baht(priceOf(p)!)}`))} per person. Tell me how many people are jumping and I'll work out the total.`;
}

function recommend(ctx: Ctx, named: Pkg[]): string | null {
  if (!pricesKnown()) return null;
  const budget = budgetOf(ctx.text);
  if (!budget && named.length >= 2) {
    const cmp = packages(ctx, named);
    const [lo, hi] = [...named].sort((a, b) => priceOf(a)! - priceOf(b)!);
    return cmp ? `${cmp}\n\nWhether ${LABEL[hi]} is worth it over ${LABEL[lo]} depends on how much you value the extra media: the jump itself is identical.` : null;
  }
  const party = ctx.resolved.partySize ?? 1;
  const needs = mediaNeeds(ctx.text);
  if (!budget && !/\b(video|videos|photo|photos|camera\w*|film|footage|record\w*|memories|no media|just the jump|only the jump)\b/i.test(ctx.text)) {
    const cmp = packages(ctx, named, true);
    if (cmp) return `${cmp}\n\nWhich is "better" depends on how much of the jump you want filmed. The jump itself is the same in all three.`;
  }
  const [eco, deluxe, vip] = PACKAGE_ORDER;
  const out: string[] = [];

  if (budget) {
    const perPersonStated = budget.perPerson;
    const perPerson = perPersonStated || party === 1 ? budget.amount : Math.floor(budget.amount / party);
    const basis = party > 1 ? (perPersonStated ? `${baht(budget.amount)} each` : `${baht(budget.amount)} in total, which is ${baht(perPerson)} each for ${party} people`) : baht(budget.amount);
    if (!perPersonStated && party > 1) ctx.figures.push(perPerson);
    const affordable = PACKAGE_ORDER.filter((p) => priceOf(p)! <= perPerson);
    if (!affordable.length) {
      out.push(`With a budget of ${basis}, even **ECO (${baht(priceOf(eco)!)} per person)** is just out of reach. ECO is the cheapest package, so there isn't a lower option I can offer.`);
    } else {
      const best = affordable[affordable.length - 1];
      out.push(`With a budget of ${basis}, the most you get is **${LABEL[best]} (${baht(priceOf(best)!)} per person)**: ${lower(packageSummary(best))}.`);
      if (party > 1) {
        const t = computeTotal([{ pkg: best, qty: party }]);
        if (t) { ctx.calcs.push(t.text); ctx.figures.push(t.total); out.push(`For ${party} people that is ${t.text}.`); }
      }
      const next = PACKAGE_ORDER[PACKAGE_ORDER.indexOf(best) + 1];
      if (next) {
        const g = (priceOf(next)! - perPerson);
        ctx.figures.push(g);
        out.push(`${LABEL[next]} would need about ${baht(g)} more per person.`);
      }
    }
    return out.join(" ");
  }

  const stepUp = gap(deluxe, eco)!, vipUp = gap(vip, deluxe)!;
  ctx.figures.push(stepUp, vipUp, gap(vip, eco)!);
  const jump = "All three give you the same jump (same aircraft, altitude and instructors), so you are only choosing how much of it is filmed.";
  let pick: Pkg | null = null;
  if (needs.premium) pick = vip;
  else if (needs.video || needs.photos) pick = deluxe;
  else if (needs.none) pick = eco;
  const sorted = named.length ? named : [];
  if (sorted.length === 1) pick = pick ?? sorted[0];

  if (pick === vip) out.push(`For a professional record of the jump, **VIP (${baht(priceOf(vip)!)})** is the one: ${lower(packageSummary(vip))}. It costs ${baht(vipUp)} more than DELUXE.`);
  else if (pick === deluxe) out.push(
    `If you want to take home video and photos, **DELUXE (${baht(priceOf(deluxe)!)})** covers ` +
      `it: ${lower(packageSummary(deluxe))}. That is ${baht(stepUp)} more than ECO. Only step up ` +
      `to VIP (another ${baht(vipUp)}) if you want a personal cameraman and an edited film.`,
  );
  else if (pick === eco) out.push(`If you only want the jump itself, **ECO (${baht(priceOf(eco)!)})** is the one: ${lower(packageSummary(eco))}.`);
  else {
    out.push(
      `${jump}\n\n- **ECO, ${baht(priceOf(eco)!)}**: best if you only want the jump itself.\n- ` +
        `**DELUXE, ${baht(priceOf(deluxe)!)}**: best if you want to take home video and photos. ` +
        `It adds ${baht(stepUp)} to ECO.\n- **VIP, ${baht(priceOf(vip)!)}**: best if you want a ` +
        `personal cameraman and an edited film. It adds ${baht(vipUp)} to DELUXE.`,
    );
    return out.join("\n\n");
  }
  out.push(jump);
  if (party > 1) {
    const t = computeTotal([{ pkg: pick, qty: party }]);
    if (t) { ctx.calcs.push(t.text); ctx.figures.push(t.total); out.push(`For ${party} people: ${t.text}.`); }
  }
  return out.join(" ");
}

function packages(ctx: Ctx, named: Pkg[], forceAll = false): string | null {
  if (!pricesKnown() || !hasFact("handycam", "cameraman")) return null;
  const evaluative = /\b(better|worth it|worth|best|should i)\b/i.test(ctx.text) && named.length <= 1 && !budgetOf(ctx.text);
  if (evaluative) forceAll = true;
  const pkgs = forceAll ? [] : contextPackages(ctx, named);
  const wantsAll = pkgs.length === 0 || pkgs.length >= 2 || /\b(packages|options|differences?|compare|comparison)\b/i.test(ctx.text);
  const out: string[] = [];
  const stepUp = gap("deluxe", "eco")!, vipUp = gap("vip", "deluxe")!;
  ctx.figures.push(stepUp, vipUp, gap("vip", "eco")!);

  if (wantsAll) {
    const show = pkgs.length >= 2 ? pkgs : PACKAGE_ORDER;
    out.push(`The jump is identical in every package (same aircraft, altitude and instructors). What changes is the media:`);
    out.push(show.map((p) => `- **${LABEL[p]}, ${baht(priceOf(p)!)} per person**: ${sentence(packageSummary(p))}`).join("\n"));
    const both = (a: Pkg, b: Pkg) => show.includes(a) && show.includes(b);
    const gaps: string[] = [];
    if (show.length === 3) gaps.push(`DELUXE is ${baht(stepUp)} above ECO, and VIP is ${baht(vipUp)} above DELUXE`);
    else if (both("eco", "deluxe")) gaps.push(`DELUXE is ${baht(stepUp)} more than ECO`);
    else if (both("deluxe", "vip")) gaps.push(`VIP is ${baht(vipUp)} more than DELUXE`);
    else if (both("eco", "vip")) gaps.push(`VIP is ${baht(gap("vip", "eco")!)} more than ECO`);
    if (gaps.length) out.push(`${gaps[0]}.`);
  } else {
    const p = pkgs[0];
    const asksMedia =
      /\b(video|videos|photos?|camera\w*|film|footage|media)\b/i.test(ctx.text) &&
      /\b(does|do|is|are|has|have|includ\w*|comes? with|get|offer\w*)\b/i.test(ctx.text) &&
      !/\b(send|share|download|attach|email|watch|play|show me|give me|brochure|pdf)\b/i.test(ctx.text);
    const lead = asksMedia ? (packageHasMedia(p) ? "Yes. " : `No, ${LABEL[p]} is the jump without any media. `) : "";
    out.push(`${lead}**${LABEL[p]} is ${baht(priceOf(p)!)} per person.** ${sentence(packageSummary(p))}`);
    if (p === "vip") {
      out.push(`In practice, the difference from DELUXE is who films you: with DELUXE the video and photos come from your instructor, while VIP adds a personal cameraman and an edited film, for ${baht(vipUp)} more.`);
    } else if (p === "deluxe") {
      out.push(`It costs ${baht(stepUp)} more than ECO. VIP goes further with a personal cameraman and an edited film, for another ${baht(vipUp)}.`);
    } else {
      out.push(`DELUXE adds handycam video and photos for ${baht(stepUp)} more.`);
    }
  }
  if (evaluative) out.push(`Which one is "better" depends on how much of the jump you want filmed. The jump itself is the same in all three.`);
  const cam = sourceBlock("src-pattaya-faq", "Camera restrictions");
  if (ctx.resolved.packages.includes("vip") || /\b(own camera|gopro|my camera)\b/i.test(ctx.text) || pkgs.includes("vip")) {
    if (cam) out.push(`One thing to know: ${lower(cam)}`);
  }
  return out.join("\n\n");
}

function reassure(ctx: Ctx, wantsPrep: boolean, wantsFear: boolean): string | null {
  const exp = sourceBlock("src-booking-faq", "Previous experience");
  const inst = sourceBlock("src-booking-faq", "Instructor");
  const brief = sourceBlock("src-booking-faq", "Briefing");
  if (!exp && !inst) return null;
  const langs = blockLines("src-pattaya-dropzone", "Instructor languages");
  const out: string[] = [];
  if (wantsFear || !wantsPrep) {
    out.push(`That's exactly who a tandem jump is designed for. ${exp ?? ""} ${inst ?? ""}`.replace(/\s+/g, " ").trim());
  } else {
    out.push(`${exp ?? "No previous experience is needed."} There is nothing to train for in advance.`);
  }
  const prep: string[] = [];
  if (brief) prep.push(`${lower(brief.replace(/\.$/, ""))}, which covers the body position and the process of the jump`);
  const checks = findSentence(/checks and tightens the harness/i);
  if (checks) prep.push(lower(checks).replace(/^the instructor/, "your instructor"));
  if (langs.length) prep.push(`instructors speak ${list(langs.map((l) => l.replace(/\.$/, "")))}`);
  if (prep.length) out.push(`On the day: ${prep.join("; ")}.`);
  if (wantsPrep || wantsFear) {
    const clothes = blockLines("src-pattaya-faq", "Clothing recommendations");
    const todo = [
      sourceBlock("src-booking-faq", "Identification"),
      clothes.length ? `Clothing: ${clothes.join(" ")}` : null,
      (sourceBlock("src-booking-faq", "Time") ?? "").split(/(?<=\.)\s+/)[0] || null,
      sourceBlock("src-booking-faq", "Minimum age"),
      blockLines("src-booking-faq", "Weight")[0] ?? null,
      sourceBlock("src-terms", "Alcohol and drugs"),
    ].filter((x): x is string => Boolean(x));
    if (todo.length) out.push(`**Before the day**\n${todo.map((t) => `- ${sentence(t)}`).join("\n")}`);
    out.push(`Jumps depend on wind and cloud, so if conditions aren't safe you may wait for another window or move to another date.`);
  }
  return out.join("\n\n");
}

interface Topic { id: string; label: string; test: RegExp; build: (text: string) => string | null }

const FIT_WORDS = /\b(?:(?:be|get|stay|are you|am i|need to be|have to be|need to get)\s+(?:very |really |quite |reasonably |physically )?fit|fit enough|fitness|physical(?:ly)?|in shape|out of shape|stamina|athletic|unfit|workout|exercis\w+|strong enough)\b/i;

/** "I weigh 120kg" or "264 lbs": returns the weight in kg, or null when none is given. */
function weightInKg(text: string): number | null {
  const kg = /\b(\d{2,3}(?:\.\d)?)\s*(?:kgs?|kilos?|kilograms?)\b/i.exec(text);
  if (kg) return Number(kg[1]);
  const lb = /\b(\d{2,3}(?:\.\d)?)\s*(?:lbs?|pounds?)\b/i.exec(text);
  return lb ? Math.round(Number(lb[1]) * 0.4536) : null;
}

/** Eligibility-style questions ("can I jump?") whose subject was stated in an earlier clause of the same message. */
const ELIGIBILITY_Q = /\b(?:can|could|may|am|will|would|should|is it (?:ok|okay|possible|safe|allowed))\s+(?:i|we|he|she|they|my \w+|it)\b[^?]{0,24}\b(?:jump|skydive|dive|go|join|do|take part|participate|fly|come|still|book|qualify|allowed|able)\b|\b(?:allowed|eligible|too (?:heavy|old|young))\b/i;

const BOOK_REQUEST = new RegExp(
  [
    String.raw`\b(?:can|could|would|will|may)\s+(?:you|u)\s+(?:please\s+)?(?:go ahead and\s+)?(?:book|reserve|arrange|schedule|confirm|`,
    String.raw`sort|organi[sz]e|buy|purchase|secure|hold|get me|make (?:a|the) (?:booking|reservation))\b|`,
    String.raw`\b(?:please\s+)?(?:book|reserve|schedule|buy|purchase|secure|hold)\s+(?:it|this|that|me|us|one|a (?:slot|spot|jump)|my|`,
    String.raw`the (?:jump|slot|package|date))\b|\b(?:book|reserve)\b[^?.!]*\bfor me\b|\bsign (?:me|us) up\b|`,
    String.raw`\b(?:i|we)(?:'d| would)? (?:like|want|wanna|love)(?: to)? (?:book|reserve)\b|`,
    String.raw`\b(?:i|we)(?:'ll| will) (?:take|book|go with) it\b|\blet'?s book\b|\bmake (?:a|the) (?:booking|reservation) for\b`,
  ].join(""),
  "i",
);
const AGE_TOPIC_TEST = new RegExp(
  [
    String.raw`\b(minimum age|age limit|how old|kids?|child(?:ren)?|teen(?:ager)?s?|under 18|too (?:old|young)|`,
    String.raw`senior|elderly|\d{1,2}[- ]?(?:years?|yrs?)[- ]old|(?:mum|mom|dad|grand\w+|parents?|son|`,
    String.raw`daughter) (?:is|are) \d{2})\b`,
  ].join(""),
  "i",
);

const TOPICS: Topic[] = [
  { id: "weight", label: "Weight limit", test: /\b(weight|weigh|weighs|kg|kgs|kilos?|kilograms?|lbs?|pounds?|heavy|overweight)\b/i, build: (text) => {
    const w = sourceBlock("src-booking-faq", "Weight");
    if (!w) return null;
    const limit = Number(/(\d{2,3})\s*kg/i.exec(w)?.[1] ?? NaN);
    const mine = weightInKg(text);
    if (mine !== null && Number.isFinite(limit)) {
      const lbNote = /\b(?:lbs?|pounds?)\b/i.test(text) && !/\bkgs?\b/i.test(text) ? " (converted from pounds)" : "";
      const rest = blockLines("src-booking-faq", "Weight").slice(1).map(sentence).join(" ");
      if (mine > limit) {
        return (
          `The tandem weight limit is ${limit} kg, so at about ${mine} kg${lbNote} you would be over it and I can't tell you that you'd be able to jump. ` +
          `The sources don't mention any exception, so ${TEAM()} is the one to ask before you book. The operator's weight limits also apply on the day.`
        );
      }
      return (
        `The tandem weight limit is ${limit} kg, so at about ${mine} kg${lbNote} you are within it. ${rest} ` +
        `The operator's weight limits also apply on the day.`
      ).replace(/\s+/g, " ").trim();
    }
    return `${sentence(w)} The operator's weight limits also apply on the day.`;
  } },
  { id: "age", label: "Age", test: AGE_TOPIC_TEST, build: () => {
    const a = sourceBlock("src-booking-faq", "Minimum age");
    return a ? `${sentence(a)} The sources give no maximum age, and health and weight requirements still apply to everyone. Participants also need to bring valid photo identification.` : null;
  } },
  { id: "medical", label: "Health", test: new RegExp(`\\b(pregnan\\w*|medical|health\\w*|asthma|heart|injur\\w*|disab\\w*|medication|surgery|conditions?)\\b|${FIT_WORDS.source}`, "i"), build: (text) => {
    const m = sourceBlock("src-terms", "Medical information");
    if (FIT_WORDS.test(text) && m) {
      const exp = sourceBlock("src-booking-faq", "Previous experience");
      const inst = sourceBlock("src-booking-faq", "Instructor");
      const age = sourceBlock("src-booking-faq", "Minimum age");
      const wt = blockLines("src-booking-faq", "Weight")[0];
      const reqs = [age, wt].filter((x): x is string => Boolean(x)).map((x) => lower(x.replace(/\.$/, "")));
      return (
        `The sources don't set a specific fitness level. ${exp ? sentence(exp) : ""} ${inst ? sentence(inst) : ""} ` +
        `${reqs.length ? `The requirements they do list are: ${reqs.join("; ")}. ` : ""}` +
        `${sentence(m)} I can't judge whether any individual is medically fit to jump, so if you have a health or fitness concern, please check with the operator before booking.`
      ).replace(/\s+/g, " ").trim();
    }
    return m ? `${sentence(m)} I can't judge whether any individual is medically fit to jump, so please check your own situation with the operator before booking.` : null;
  } },
  { id: "weather", label: "Weather", test: /\b(weather|wind|cloud|rain\w*|monsoon|postpone\w*|resched\w*|forecast|bad weather)\b/i, build: () => {
    const w = sourceBlock("src-booking-faq", "Weather");
    const yr = findSentence(/operates throughout the year/i) && findSentence(/loads run every day/i) ? " The dropzone operates throughout the year, and loads run every day." : "";
    return w ? `${sentence(w)}${yr} The sources don't name a best season, and they don't promise a jump will go ahead in poor conditions.` : null;
  } },
  { id: "payment", label: "Payment", test: /\b(pay|payment|deposit|advance|credit card|cards?|promptpay|cash|prepay)\b/i, build: () => {
    const p = sourceBlock("src-booking-faq", "Payment");
    const t = sourceBlock("src-terms", "Payment");
    return p ? `${sentence(p)} ${t ? sentence(t.split(". ").slice(0, 3).join(". ")) : ""} The accepted payment methods aren't listed in the sources.`.replace(/\s+/g, " ").trim() : null;
  } },
  { id: "bookreq", label: "Booking", test: BOOK_REQUEST, build: () => {
    return (
      `I can't book or reserve anything for you: this concierge only answers questions and has no booking tools. ` +
      `To book, use the booking form on the Sea View Skydiving page. ` +
      `Submitting it sends a request, and the team confirms availability through WhatsApp, so nothing is confirmed until they reply. ` +
      `I'm happy to answer questions first, such as prices or what each package includes.`
    );
  } },
  { id: "booking", label: "How to book", test: /\b(how (?:do|can|to) (?:i |we )?book|booking process|reserve|reservation|how does booking work)\b/i, build: () => {
    const b = sourceBlock("src-booking-faq", "Booking");
    const fields = blockLines("src-booking-page", "The booking request asks for").map((f) => lower(f.replace(/\.$/, "")).replace(/whatsapp/gi, "WhatsApp"));
    return b ? `${sentence(b)} The booking form asks for ${list(fields)}. Submitting it is a request, not a confirmed booking: the team confirms through WhatsApp.` : null;
  } },
  { id: "clothing", label: "What to wear", test: /\b(wear|clothes|clothing|shoes|trainers|sandals|jewell?ery|dress)\b/i, build: () => {
    const c = blockLines("src-pattaya-faq", "Clothing recommendations").map((l) => lower(l.replace(/\.$/, "")));
    return c.length ? `The dropzone's clothing guidance: ${c.join("; ")}.` : null;
  } },
  { id: "camera", label: "Own camera", test: /\b(gopro|own camera|my camera|bring (?:a |my )?camera)\b/i, build: () => {
    const c = sourceBlock("src-pattaya-faq", "Camera restrictions");
    return c ? `${sentence(c)} Camera coverage comes through the packages instead.` : null;
  } },
  { id: "languages", label: "Languages", test: /\b(language|english|hindi|thai|speak)\b/i, build: () => {
    const l = blockLines("src-pattaya-dropzone", "Instructor languages").map((x) => x.replace(/\.$/, ""));
    return l.length ? `Instructors at the dropzone speak ${list(l)}.` : null;
  } },
  { id: "contact", label: "Contact", test: /\b(contact|whatsapp|phone|email|call you|reach you|get in touch)\b/i, build: () => {
    const c = sourceBlock("src-booking-faq", "Contact");
    return c ? sentence(c) : null;
  } },
  { id: "refund", label: "Refunds and cancellation", test: /\b(refund\w*|cancel\w*|money back|deposit)\b/i, build: () => {
    const m = findSentence(/media portion[^.]*refunded/i);
    return (
      `The only refund condition stated in the sources concerns media: ` +
      `${m ? lower(m) : "see the terms"}. No general cancellation or refund policy is ` +
      `published, so I can't say what happens if you cancel or miss your slot. ${asTeam()} can ` +
      `confirm.`
    );
  } },
  { id: "alcohol", label: "Alcohol and drugs", test: /\b(alcohol|drunk|drinking|drugs?|hungover)\b/i, build: () => {
    const a = sourceBlock("src-terms", "Alcohol and drugs");
    return a ? sentence(a) : null;
  } },
  { id: "waiver", label: "Waiver and risk", test: /\b(waiver|liability|sign)\b/i, build: () => {
    const w = sourceBlock("src-terms", "Waiver");
    return w ? `${sentence(w)} Adventure sports carry inherent risk.` : null;
  } },
  { id: "company", label: "Greedy Adventures", test: /\b(india|mount abu|rajasthan|about greedy|who are you|who is greedy|what is greedy|which countries|other (?:locations|destinations))\b/i, build: () => {
    const th = findSentence(/^Sea View Skydiving — Pattaya/i);
    const ind = findSentence(/^Tandem Skydive — Mount Abu/i);
    const offer = findSentence(/offers tandem skydiving experiences in Thailand and India/i);
    if (!offer) return null;
    return (
      `Greedy Adventures ${lower(offer.replace(/^The company /, ""))}. In Thailand that is ` +
      `${th ? th.replace(/^Sea View Skydiving — /, "Sea View Skydiving in ") : "Sea View Skydiving in Pattaya"}` +
      `; in India it is ` +
      `${ind ? ind.replace(/^Tandem Skydive — /, "a tandem skydive in ") : "a tandem skydive in Mount Abu, Rajasthan"}` +
      `. The prices and packages I can quote are for the Thailand experience only; I don't ` +
      `have India pricing or details.`
    );
  } },
  { id: "about", label: "Tandem skydiving", test: /\bwhat(?:'s| is) (?:a )?(?:tandem )?(?:skydiv\w*|tandem)\b|\bhow does (?:a )?(?:tandem )?(?:skydiv\w*|it) work\b/i, build: () => {
    const a = findSentence(/tandem skydive is designed for first-time jumpers/i);
    const b = findSentence(/harnessed to an instructor who handles/i);
    return a && b ? `${sentence(a)} ${sentence(b)} A ground briefing beforehand explains the body position and the process of the jump.` : null;
  } },
  { id: "safety", label: "Safety", test: /\b(safe|safety|dangerous|parachute|reserve (?:parachute|chute)|harness|equipment)\b/i, build: () => {
    const eq = blockLines("src-skydiving-overview", "The equipment described includes").map((l) => lower(l.replace(/\.$/, "")));
    return eq.length ? (
      `Each jump uses ${list(eq)}. The instructor checks and tightens the harness before ` +
      `boarding and again in the aircraft, and a USPA-certified instructor handles the jump. ` +
      `As with any adventure sport there is inherent risk, and the instructor or pilot can ` +
      `delay or stop a jump on safety grounds.`
    ) : null;
  } },
];

function timings(): string | null {
  const lines = blockLines("src-sea-view-plan", "Sea View experience details").filter((l) => !/^location/i.test(l));
  if (!lines.length) return null;
  const time = sourceBlock("src-booking-faq", "Time");
  return `${lines.map((l) => `- ${l}`).join("\n")}${time ? `\n\nFor planning, the booking FAQ says: ${lower(time)}` : ""}`;
}

function flow(): string | null {
  const steps = planSteps();
  if (!steps.length) return null;
  return `The ${steps.length}-step plan:\n\n${steps.map((s, i) => `${i + 1}. **${s.title}**: ${s.detail}`).join("\n")}`;
}

function hours(): string {
  const everyDay = findSentence(/loads run every day/i);
  return `${everyDay ? `${everyDay}, but` : "However,"} the sources don't publish daily opening or closing times, so I can't give you hours. Send your preferred date to ${TEAM()} and they'll confirm a slot.`;
}

const has = (intents: Intent[], ...wanted: Intent[]): boolean => wanted.some((w) => intents.includes(w));

function keysFor(part: QuestionPart, ctx: Ctx): { key: string; heading: string }[] {
  const t = part.text;
  const named = mentionedPackages(t);
  const intents = effectiveIntents(ctx.resolved, ctx.state, part.intents);
  const keys: { key: string; heading: string }[] = [];
  const add = (key: string, heading: string) => { if (!keys.some((k) => k.key === key)) keys.push({ key, heading }); };

  if (has(intents, "directions", "pickup", "location", "travel_time")) {
    const timeOnly = /\b(how long|how far|travel time|drive time|distance)\b/i.test(t) && !/\b(how (?:do|can|should)|directions?|route|pick[- ]?up|address|where|which way)\b/i.test(t);
    if (timeOnly) add("traveltime", "Travel time");
    else add("transport", "Getting to the dropzone");
  }
  if (has(intents, "combined_media")) add("combined_media", "Combined video");
  if (has(intents, "joint_booking") && /\b(book\w*|separate\w*|reservation|together|individual\w*)\b/i.test(t) && !has(intents, "combined_media", "total_cost")) add("joint", "Booking together");
  const wantsTotal =
    has(intents, "total_cost") ||
    (ctx.resolved.partySize && ctx.resolved.partySize > 1 && /\b(how much|cost|price|total|pay)\b/i.test(t)) ||
    Boolean((ctx.resolved.addedPeople || partySizeOf(t)) && ctx.resolved.partySize && ctx.resolved.partySize > 1 && !keys.length);
  if (wantsTotal) add("totals", "Total cost");
  if (has(intents, "recommendation", "budget") || budgetOf(ctx.resolved.text)) add("recommend", "Which package");
  // "Am I too heavy at 95 kg?" is an eligibility question, not a request for first-timer reassurance.
  const explicitEligibility = weightInKg(t) !== null || /\btoo (?:heavy|old|young)\b/i.test(t);
  const fearful = /\b(terrified|scared|afraid|nervous|anxious|fear\w*|phobia|heights?|worried)\b/i.test(ctx.resolved.text);
  if ((has(intents, "first_timer", "experience_required", "preparation") && !explicitEligibility) || fearful) add("reassure", "First jump");
  if (has(intents, "duration")) add("timings", "Timing");
  if (has(intents, "opening_hours")) add("hours", "Opening times");
  if (/\b(steps?|what happens|what to expect|check[- ]?in|plan)\b/i.test(t) && !has(intents, "first_timer", "preparation")) add("flow", "How the day works");
  for (const topic of TOPICS) {
    if (topic.id === "booking" && keys.some((k) => k.key === "topic:bookreq")) continue;
    const matches =
      topic.test.test(t) ||
      (topic.id === "age" &&
        part.isQuestion &&
        /\bcan (?:he|she|they|my \w+) (?:come|jump|join|do)\b/i.test(t) &&
        topic.test.test(ctx.resolved.text)) ||
      (["weight", "age", "medical"].includes(topic.id) &&
        part.isQuestion &&
        ELIGIBILITY_Q.test(t) &&
        topic.test.test(ctx.resolved.text));
    const explicit = (topic.id === "weight" && weightInKg(t) !== null) || (["weight", "age"].includes(topic.id) && /\btoo (?:heavy|old|young)\b/i.test(t));
    if (matches && (!has(intents, "first_timer") || explicit)) add(`topic:${topic.id}`, topic.label);
  }
  const pkgWords = /\b(packages?|prices?|cost|how much|compare|difference|includ\w*|options?|upgrade|cheapest|vip|deluxe|eco)\b/i.test(t) || has(intents, "includes", "media");
  const handled = keys.some((k) => ["totals", "recommend", "transport", "joint", "combined_media", "topic:bookreq"].includes(k.key));
  if ((named.length || pkgWords) && !handled) add("packages", "Packages");
  else if (named.length && ctx.resolved.partySize && ctx.resolved.partySize > 1 && !keys.some((k) => k.key === "totals")) add("totals", "Total cost");
  return keys;
}

function build(key: string, ctx: Ctx, named: Pkg[], partsText: string): string | null {
  const sub: Ctx = { ...ctx, text: `${partsText} ${ctx.resolved.text}` };
  switch (key) {
    case "transport": return transport(sub);
    case "traveltime": return transport(sub);
    case "joint": return jointBooking();
    case "combined_media": return combinedMedia();
    case "totals": return totals(sub, named);
    case "recommend": return recommend(sub, named);
    case "reassure":
      return reassure(
        sub,
        /\b(prepar\w*|training|train|practi[cs]e|before|need to|beforehand|what do i)\b/i.test(partsText),
        /\b(nervous|scared|afraid|anxious|worried|fear\w*|terrified|first|heights?)\b/i.test(ctx.resolved.text),
      );
    case "timings": return timings();
    case "hours": return hours();
    case "flow": return flow();
    case "packages": return packages(sub, named);
    default: {
      const topic = TOPICS.find((x) => `topic:${x.id}` === key);
      return topic ? topic.build(sub.text) : null;
    }
  }
}

function gift(ctx: Ctx, named: Pkg[]): string | null {
  if (!hasFact("free greedy adventures gift")) return null;
  const pkg = contextPackages(ctx, named)[0];
  if (pkg && pkg !== "vip") return `No. A free Greedy Adventures gift is listed only for the **VIP** package, not ${LABEL[pkg]}.`;
  const vip = priceOf("vip");
  return `Yes. **VIP**${vip ? ` (${baht(vip)} per person)` : ""} includes a free Greedy Adventures gift. It is not listed for ECO or DELUXE.`;
}

function rating(): string | null {
  return hasFact("4.9/5", "835") ? "The loaded information lists the experience as rated **4.9/5 based on 835 reviews**." : null;
}

interface TerseTopic { key: string; heading: string; test: RegExp; build: (ctx: Ctx, named: Pkg[]) => string | null }

/**
 * Keyword-style messages ("passport", "stars", "gift") that name a topic without asking a
 * clause-level question. Only consulted when nothing else in the message produced a section.
 */
const TERSE_TOPICS: TerseTopic[] = [
  { key: "gift", heading: "Free gift", test: topicOf("gift", "present", "souvenir", "freebie"), build: gift },
  { key: "rating", heading: "Rating", test: topicOf("rating", "rated", "reviews?", "stars?", "reputation"), build: rating },
  { key: "flow", heading: "How the day works", test: topicOf("passport", "photo id", "briefing", "arrival", "arrive", "arrives", "check-in", "check in"), build: flow },
  { key: "packages", heading: "Packages", test: topicOf("package", "packages", "price", "prices", "costs?", "compare", "comparison", "difference", "options?", "choose", "cheapest", "expensive", "how much", "baht", "upgrade", "extra"), build: (ctx, named) => packages(ctx, named) },
];

function recoverTerse(ctx: Ctx, named: Pkg[]): Section | null {
  const topic = TERSE_TOPICS.find((t) => t.test.test(ctx.text) || (t.key === "packages" && named.length > 0));
  if (!topic) return null;
  const text = topic.build(ctx, named);
  return text
    ? { key: topic.key, heading: topic.heading, text, answered: true }
    : { key: topic.key, heading: topic.heading, text: `I don't have that detail in the information I've been given, so I won't guess. ${asTeam()} can confirm it.`, answered: false };
}

export function compose(resolved: ResolvedQuery, state: ConversationState): Composition {
  const parts = questionsOf(resolved.text);
  const ctx: Ctx = { state, resolved, text: resolved.text, intents: [], calcs: [], figures: [] };
  const groups = new Map<string, { heading: string; texts: string[]; named: Pkg[] }>();

  const order: ({ group: string } | { section: Section })[] = [];
  const unanswered: string[] = [];
  const messageNamed = mentionedPackages(resolved.text);

  for (const part of parts) {
    const restricted = checkRestrictedTopic(part.text);
    if (restricted) {
      const key = `restricted:${restricted.term}`;
      if (!order.some((o) => "section" in o && o.section.key === key)) order.push({ section: { key, heading: "Not covered", text: refusalFor(restricted), answered: false } });
      continue;
    }
    const keys = keysFor(part, ctx);
    if (!keys.length) {
      if (part.isQuestion) unanswered.push(part.text);
      continue;
    }
    for (const k of keys) {
      if (!groups.has(k.key)) { groups.set(k.key, { heading: k.heading, texts: [], named: [] }); order.push({ group: k.key }); }
      const g = groups.get(k.key)!;
      g.texts.push(part.text);
      for (const p of mentionedPackages(part.text)) if (!g.named.includes(p)) g.named.push(p);
    }
  }

  if (!order.length && !unanswered.length) {
    const recovered = recoverTerse(ctx, messageNamed);
    if (recovered) order.push({ section: recovered });
  }

  const sections: Section[] = [];
  for (const entry of order) {
    if ("section" in entry) { sections.push(entry.section); continue; }
    const g = groups.get(entry.group)!;
    const named = g.named.length ? g.named : messageNamed;
    const text = build(entry.group, ctx, named, g.texts.join(" "));

    sections.push(text
      ? { key: entry.group, heading: g.heading, text, answered: entry.group !== "hours" && entry.group !== "traveltime" }
      : { key: entry.group, heading: g.heading, text: `I don't have that detail in the information I've been given, so I won't guess. ${asTeam()} can confirm it.`, answered: false });
  }
  if (unanswered.length) {
    // The visitor's own words are not quoted back: pasting a half-sentence into the reply reads awkwardly.
    const text = sections.length
      ? `I don't have anything on the rest of your question in the Sea View Skydiving information, so I won't guess. ${asTeam()} can confirm it.`
      : `I don't have anything on that in the Sea View Skydiving information I've been given, so I'd rather not guess. ${asTeam()} can confirm it. ${CAPABILITY_HINT}`;
    sections.push({ key: "unanswered", heading: "Not covered", text, answered: false });
  }
  return { sections, calcs: ctx.calcs, figures: ctx.figures, parts: parts.map((p) => p.text), answered: sections.some((s) => s.answered) };
}

export function renderComposition(c: Composition): string {
  if (c.sections.length === 1) return c.sections[0].text;
  return c.sections.map((s) => `**${s.heading}**\n${s.text}`).join("\n\n");
}
