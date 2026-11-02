export type RestrictedKind = "coming_soon_activity" | "unlisted_activity" | "unlisted_operational_fact";

export interface RestrictedTopic {
  kind: RestrictedKind;

  term: string;
}

const COMING_SOON = /\b(scuba|paragliding|paraglide|snowboard(?:ing)?)\b/i;
const UNLISTED_ACTIVITY = /\b(wingsuit|bungee|aff|solo (?:jump|skydive)|base jump|zip ?line|helicopter)\b/i;

const OPERATIONAL: [RegExp, string][] = [
  [/\b(discount\w*|promo\w*|coupon\w*|voucher\w*|group (?:rate|price|discount)s?|student (?:rate|price|discount)|early[- ]bird)\b/i, "discounts, promotions or group rates"],
  [/\b(insurance|insured|travel cover)\b/i, "insurance cover"],
  [/\b(best (?:time|season|month|months)|time of year|high season|low season|peak season|off[- ]season)\b/i, "the best time of year to visit"],
  [/\b(safety record|accident\w*|fatalit\w*|incident\w*|aircraft model|tail number|cessna|caravan|pilot experience)\b/i, "safety statistics or aircraft details"],
  [/\b(parking|food|lunch|restaurants?|toilets?|showers?|lockers?|spectators?|friends watch|wifi)\b/i, "dropzone facilities"],
];

export function checkRestrictedTopic(query: string): RestrictedTopic | null {
  const soon = COMING_SOON.exec(query);
  if (soon) return { kind: "coming_soon_activity", term: soon[1].toLowerCase() };
  const unlisted = UNLISTED_ACTIVITY.exec(query);
  if (unlisted) return { kind: "unlisted_activity", term: unlisted[1].toLowerCase() };
  for (const [pattern, term] of OPERATIONAL) {
    if (pattern.test(query)) return { kind: "unlisted_operational_fact", term };
  }
  return null;
}

export const CAPABILITY_HINT =
  "I can help with the three packages and their prices, what each includes, the dropzone location, jump timings, the 5-step plan, Bangkok pickup, the brochure PDF or the preview video.";

export function refusalFor(topic: RestrictedTopic): string {
  switch (topic.kind) {
    case "coming_soon_activity":
      return (
        `I can't give details or prices for ${topic.term}. Greedy Adventures lists ` +
        `paragliding, scuba diving and snowboarding as **coming soon**, so there is nothing I ` +
        `can responsibly say about availability or pricing yet.`
      );
    case "unlisted_activity":
      return `${topic.term.charAt(0).toUpperCase() + topic.term.slice(1)} isn't among the activities in the Sea View Skydiving information I have, so I can't confirm it. The experience on offer is the tandem skydive.`;
    default:
      return `The information I have doesn't cover ${topic.term}, so I'd rather not guess. The Greedy Adventures team can confirm it directly.`;
  }
}

export const GENERIC_UNAVAILABLE =
  "I don't have that in the Sea View Skydiving information I've been given, so I can't answer it without guessing. The Greedy Adventures team can confirm it directly.";
