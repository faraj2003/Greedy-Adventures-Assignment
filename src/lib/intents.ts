import { anyOf, classifier, keywords } from "./patterns";

// Intent classification is table-driven: each intent owns a named list of phrase
// patterns, and `anyOf` joins a list into one word-bounded alternation. To teach the
// concierge a new phrasing, add an entry to the relevant list.

const OPENING_HOURS_PHRASES: RegExp[] = [
  /opening hours/,
  /open hours/,
  /business hours/,
  /opening times?/,
  /closing times?/,
  /closing/,
  /are you open/,
  /is it open/,
  /is the dropzone open/,
  /open (?:on|at|until|till|every|daily|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d)/,
  /what time\b[^?]*\b(?:open|close)/,
  /when (?:are|do|does|is)\b[^?]*\b(?:open|close)/,
  /how long are you open/,
  /until what time/,
  /(?:your|the|its|what|which) hours/,
];

const DURATION_PHRASES: RegExp[] = [
  /how long/,
  /how much time/,
  /how many (?:hours|minutes|seconds)/,
  /hours? (?:should|do|to|will|must) (?:i|we|you)\b[^?]*\b(?:plan|allow|budget|set aside|reserve)/,
  /how high/,
  /what height/,
  /what altitude/,
  /altitude/,
  /(?:height|altitude) of (?:the |our |a )?(?:jump|exit|skydive|dive|tandem|experience|drop|plane|aircraft)/,
  /(?:the )?height (?:we|you|they|i) (?:jump|exit|skydive|leave|go)/,
  /duration/,
  /free[- ]?fall/,
  /canopy/,
  /jump (?:time|height|altitude|duration)/,
  /exit (?:height|altitude)/,
  /total time/,
  /time (?:at|on) the dropzone/,
  /13,?000/,
  /in the air/,
  /airborne/,
  /(?:time|long)[^?]*\b(?:spend|spent|am i|are we)\b[^?]*\b(?:falling|flying|floating|gliding|descending)/,
  /flight time/,
  /sightseeing flight/,
];

const DURATION_SUBJECTS: RegExp[] = [
  /experience/,
  /jump/,
  /skydive/,
  /activity/,
  /session/,
  /tandem/,
];

const DURATION_VERBS: RegExp[] = [
  /take/,
  /takes/,
  /last/,
  /lasts/,
];

const TRAVEL_DISTANCE_QUESTIONS: RegExp[] = [
  /how long/,
  /how much time/,
  /how many (?:hours|minutes)/,
  /how far/,
];

const TRAVEL_ROUTE_WORDS: RegExp[] = [
  /get(?:ting)? (?:there|here|from|to (?!\d|altitude|the (?:altitude|exit|top|jump|height)))/,
  /reach(?:ing)?/,
  /drive/,
  /driving/,
  /travel(?:l?ing)?/,
  /commut\w+/,
  /journey/,
  /transfer/,
  /from (?:bangkok|pattaya|the airport|my hotel|the hotel)/,
];

const TRAVEL_NOUNS: RegExp[] = [
  /drive/,
  /journey/,
  /commute/,
  /travel time/,
  /transfer time/,
];

const DIRECTIONS_PHRASES: RegExp[] = [
  /directions?/,
  /(?:how|where)\s+(?:do|can|could|would|should|will)\s+(?:i|we)\s+(?:get|reach|travel|go|come|arrive)\b/,
  /(?:way|ways|route|routes|option|options)\s+(?:to|of|for)\s+(?:get(?:ting)?|reach(?:ing)?|travel(?:l?ing)?|go(?:ing)?|com(?:e|ing)|arriv(?:e|ing))/,
  /(?:get(?:ting)?|reach(?:ing)?|travel(?:l?ing)?|arriv(?:e|ing))\s+(?:to|at|from|there|here)\b/,
  /(?:go(?:ing)?|com(?:e|ing)|driv(?:e|ing)|head(?:ing)?)\s+(?:to|from)\s+(?:the|your|you|pattaya|rayong|bangkok|there|dropzone|sea ?view)/,
  /(?:go(?:ing)?|com(?:e|ing))\s+(?:there|here)\b/,
  /transport\w*/,
  /taxi/,
  /grab/,
  /bolt/,
  /bus/,
  /minivan/,
  /train/,
  /rent(?:al)? (?:a )?car/,
  /public transport/,
  /how far/,
  /meeting point/,
  /find (?:you|the dropzone|the location|your location)/,
];

const RECOMMENDATION_PHRASES: RegExp[] = [
  /recommend\w*/,
  /suggest\w*/,
  /advis\w*/,
  /which (?:package|option|one|tier|plan)/,
  /what (?:should|would) (?:i|we) (?:choose|pick|get|go for|take|book|do)/,
  /what(?:'s| is) (?:the )?best/,
  /best (?:package|option|choice|for)/,
  /help me (?:choose|pick|decide)/,
  /which is (?:better|best|right)/,
  /worth (?:it|the)/,
  /is (?:that|it|this) the (?:cheapest|best|right)/,
];

const JOINT_BOOKING_PHRASES: RegExp[] = [
  /book(?:ing)? (?:separately|individually|together|jointly|as a group|for (?:two|2|both|us|three|3|four|4|five|5))/,
  /separate(?:ly)? (?:booking|bookings|booked)/,
  /(?:each|both|all) (?:of us )?(?:need|have|must|should) (?:to )?book/,
  /(?:one|single|same|two|2|separate) (?:booking|bookings|reservation)/,
  /(?:with|bring(?:ing)?|come with|coming with|joining|join) (?:me|my|a|our)\s*(?:friends?|wife|husband|partner|girlfriend|boyfriend|family|brother|sister|kids?|son|daughter|colleagues?|group)/,
  /my (?:friends?|wife|husband|partner|girlfriend|boyfriend|brother|sister)\b/,
  /(?:two|2|three|3|four|4|five|5|six|6|both|all) (?:of us|people|persons?|passengers?|jumpers?|friends)/,
  /jump(?:ing)? together/,
  /both of us/,
  /us both/,
  /(?:we|us)(?:'ll|'d| will| would)? both/,
  /both (?:choose|pick|want|take|book|go)/,
  /we(?:'re| are) (?:two|2|three|3|four|4|five|5|six|6)/,
  /group (?:of|booking|size)/,
];

const PREPARATION_PHRASES: RegExp[] = [
  /training/,
  /trained/,
  /prepar\w*/,
  /just (?:arrive|turn up|show up|rock up|walk in|jump|go)/,
  /(?:arrive|turn up|show up|walk in) and (?:jump|go|skydive)/,
  /without (?:any )?(?:training|prep\w*|instructions?|briefing|practice)/,
  /need to (?:train|practi[cs]e|learn|study|prepare)/,
  /practi[cs]e/,
  /lesson/,
  /course/,
  /before (?:the|my|our) jump/,
  /beforehand/,
  /what (?:do|should) i (?:do|need) before/,
];

const FIRST_TIMER_PHRASES: RegExp[] = [
  /nervous/,
  /scared/,
  /afraid/,
  /anxious/,
  /anxiety/,
  /worried/,
  /worry/,
  /fear\w*/,
  /terrified/,
  /frightened/,
  /apprehensive/,
  /first[- ]?time(?:r|rs)?/,
  /never (?:done|jumped|skydived|tried)/,
  /(?:haven't|have not|hasn't) (?:done|jumped|skydived)/,
  /suitable for (?:me|someone|a beginner|beginners)/,
  /someone like me/,
  /am i (?:too|able|ready)/,
  /can i do (?:it|this)/,
  /beginner/,
  /newbie/,
  /novice/,
];

const TOTAL_COST_PHRASES: RegExp[] = [
  /total/,
  /altogether/,
  /all together/,
  /in total/,
  /in all/,
  /grand total/,
  /sum/,
  /combined (?:cost|price)/,
  /(?:cost|price) (?:for|of) (?:all|both|the group|everyone|\d+|two|three|four|five|six)/,
  /how much (?:for|would|will|is|are|do|does|to)\b[^?]*\b(?:all|both|together|group|\d+|two|three|four|five|six)/,
  /how much (?:would|will|do|does) (?:it|that|this|they|we) (?:cost|be)/,
  /(?:\d+|two|three|four|five|six|seven|eight)\s*(?:x|×|times)?\s*(?:eco|deluxe|vip)/,
];

const INCLUDES_PHRASES: RegExp[] = [
  /what(?:'s| is| are| exactly| all)?\s*(?:included|inclusions?|in (?:it|the package|that|this))/,
  /what (?:exactly |precisely |all )?(?:will|do|would|can|does) (?:we|i|you|they|it|each)\s*(?:get|receive|include|come with|have)/,
  /what (?:does|do) (?:\w+ )?(?:include|come with|cover|get)/,
  /what comes with/,
  /what do (?:we|i) get/,
  /inclusions?/,
  /includes?\b/,
  /come with/,
];

const COMBINED_MEDIA_PHRASES: RegExp[] = [
  /(?:our|both|the two|each|their)(?: of (?:us|our))?\s+(?:videos?|footage|films?|photos?|clips?|media)\b[^?.!]*\b(?:together|combined|merged|same|one|single|shared|joined|in one|as one)/,
  /(?:videos?|footage|films?|photos?|clips?|media)\b[^?.!]*\b(?:together|combined|merged|joined|in (?:one|the same)|as one|same (?:video|film|file|clip)|one (?:video|film|file|clip)|single (?:video|film|file|clip)|shared)/,
  /(?:combine|merge|join|share|put)\b[^?.!]*\b(?:videos?|footage|films?|photos?|clips?)/,
];

const BUDGET_PHRASES: RegExp[] = [
  /cheap\w*/,
  /budget/,
  /afford\w*/,
  /inexpensive/,
  /economical/,
  /low(?:est)?[- ](?:cost|price)/,
  /best value/,
  /good value/,
  /value for money/,
  /save (?:money|some)/,
  /spend (?:too much|a lot|less|more)/,
  /(?:don't|do not|dont|not) (?:want|wanna|like) to (?:spend|pay)/,
  /(?:not|n't) (?:too|that|very) (?:much|expensive|pricey)/,
  /too (?:expensive|pricey)/,
  /(?:price|cost) (?:is|matters)/,
  /(?:tight|limited|small) budget/,
  /most affordable/,
  /(?:under|below|within|less than|no more than|max(?:imum)?(?: of)?) (?:฿|\d|\d{4,}|\d{1,3}(?:,\d{3})+|thb|baht)/,
];

const NO_MEDIA_PHRASES: RegExp[] = [
  /no (?:photos?|videos?|media|camera|footage)/,
  /(?:don't|do not|dont) (?:need|want) (?:any )?(?:photos?|videos?|media|camera|footage)/,
  /without (?:photos?|videos?|media|camera)/,
  /just (?:the )?jump/,
  /only (?:the )?jump/,
];

const PICKUP_PHRASES: RegExp[] = [
  /pick[- ]?ups?/,
  /picked up/,
  /pick (?:me|us) up/,
  /transfers?/,
  /shuttle/,
  /collect(?:ed|ion)? (?:me|us|from)/,
  /hotel (?:pick|transfer)/,
  /drop[- ]?off/,
];

const LOCATION_PHRASES: RegExp[] = [
  /where (?:is|are|exactly)/,
  /where do you/,
  /where does/,
  /address/,
  /location/,
  /located/,
  /dropzone/,
  /drop zone/,
  /find you/,
  /find the (?:dropzone|location)/,
  /on (?:a )?map/,
  /google maps?/,
  /coordinates?/,
  /pin/,
];

const ORIGIN_PHRASES: RegExp[] = [
  /bangkok/,
  /bkk/,
  /suvarnabhumi/,
  /don mueang/,
  /phuket/,
  /chiang mai/,
  /pattaya (?:city|beach|hotel)/,
  /my hotel/,
  /the hotel/,
  /the airport/,
];

const EXPERIENCE_REQUIRED_PHRASES: RegExp[] = [
  /(?:previous|prior|any|no) (?:skydiving )?experience/,
  /experience (?:needed|required|necessary)/,
  /need (?:any )?experience/,
  /experienced/,
];

const MEDIA_KEYWORDS = keywords("video", "videos", "photo", "photos", "picture", "pictures", "pics", "images?", "footage", "handycam", "camera", "cameras", "cameraman", "film", "films", "filmed", "record(?:ed|ing)?", "media", "clip", "clips", "gopro", "capture");
const VIDEO_KEYWORDS = keywords("video", "videos", "footage", "film", "films", "filmed", "record(?:ed|ing)?", "handycam", "clip", "clips", "gopro", "movie");
const PHOTO_KEYWORDS = keywords("photo", "photos", "picture", "pictures", "pics", "images?", "snaps");
const PREMIUM_MEDIA_PHRASES = keywords("cameraman", "videographer", "professional", "edited", "cinematic", "full (?:media )?coverage", "premium", "highlight reel", "personal camera", "best (?:footage|video|quality)");

const OPENING_HOURS = classifier([anyOf(OPENING_HOURS_PHRASES)], "i");
const DURATION_ALTITUDE = classifier([anyOf(DURATION_PHRASES), `${anyOf(DURATION_SUBJECTS)}[^?]*${anyOf(DURATION_VERBS)}`], "i");
const TRAVEL_TIME = classifier([`${anyOf(TRAVEL_DISTANCE_QUESTIONS)}[^?]*${anyOf(TRAVEL_ROUTE_WORDS)}`, `${anyOf(TRAVEL_NOUNS)} (?:to|from)\\b`], "i");
const DIRECTIONS = classifier([anyOf(DIRECTIONS_PHRASES)]);
const BUDGET = classifier([anyOf(BUDGET_PHRASES), /฿\s?\d/.source]);
const RECOMMENDATION = classifier([anyOf(RECOMMENDATION_PHRASES)]);
const JOINT_BOOKING = classifier([anyOf(JOINT_BOOKING_PHRASES)]);
const COMBINED_MEDIA = classifier([anyOf(COMBINED_MEDIA_PHRASES)]);
const PREPARATION = classifier([anyOf(PREPARATION_PHRASES)]);
const FIRST_TIMER = classifier([anyOf(FIRST_TIMER_PHRASES)]);
const TOTAL_COST = classifier([anyOf(TOTAL_COST_PHRASES)]);
const INCLUDES = classifier([anyOf(INCLUDES_PHRASES)]);
const PICKUP = classifier([anyOf(PICKUP_PHRASES)]);
const LOCATION = classifier([anyOf(LOCATION_PHRASES)]);
const ORIGIN = classifier([`\\b(${ORIGIN_PHRASES.map((p) => p.source).join("|")})\\b`]);
const EXPERIENCE_REQUIRED = classifier([anyOf(EXPERIENCE_REQUIRED_PHRASES)]);
const MEDIA_WORDS = classifier([anyOf(MEDIA_KEYWORDS)]);
const NO_MEDIA = classifier([anyOf(NO_MEDIA_PHRASES)]);
const VIDEO_WORDS = classifier([anyOf(VIDEO_KEYWORDS)]);
const PHOTO_WORDS = classifier([anyOf(PHOTO_KEYWORDS)]);
const PREMIUM_MEDIA_WORDS = classifier([anyOf(PREMIUM_MEDIA_PHRASES)]);

export function isTravelTimeQuestion(q: string): boolean {
  return TRAVEL_TIME.test(q.replace(/[’‘]/g, "'"));
}

export function isOpeningHoursQuestion(q: string): boolean {
  return OPENING_HOURS.test(q);
}

export function isDurationOrAltitudeQuestion(q: string): boolean {
  const text = q.replace(/[’‘]/g, "'");
  return !isOpeningHoursQuestion(text) && !isTravelTimeQuestion(text) && DURATION_ALTITUDE.test(text);
}

const normalize = (q: string): string => q.replace(/[’‘]/g, "'").toLowerCase();

export interface MediaNeeds {
  video: boolean;

  photos: boolean;

  premium: boolean;

  none: boolean;
}

export function mediaNeeds(q: string): MediaNeeds {
  const t = normalize(q);
  const none = NO_MEDIA.test(t);
  return {
    video: VIDEO_WORDS.test(t) && !none,
    photos: PHOTO_WORDS.test(t) && !none,
    premium: PREMIUM_MEDIA_WORDS.test(t),
    none,
  };
}

export function isDirectionsQuestion(q: string): boolean {
  const t = normalize(q);
  return !isTravelTimeQuestion(t) && DIRECTIONS.test(t);
}
export function isPickupQuestion(q: string): boolean { return PICKUP.test(normalize(q)); }
export function isLocationQuestion(q: string): boolean { return LOCATION.test(normalize(q)); }
export function mentionsOrigin(q: string): string | null { const m = ORIGIN.exec(normalize(q)); return m ? m[1] : null; }
export function isBudgetQuestion(q: string): boolean { return BUDGET.test(normalize(q)); }
export function isRecommendationRequest(q: string): boolean { return RECOMMENDATION.test(normalize(q)); }
export function isJointBookingQuestion(q: string): boolean { return JOINT_BOOKING.test(normalize(q)); }
export function isCombinedMediaQuestion(q: string): boolean { return COMBINED_MEDIA.test(normalize(q)); }
export function isPreparationQuestion(q: string): boolean { return PREPARATION.test(normalize(q)); }
export function isFirstTimerQuestion(q: string): boolean { return FIRST_TIMER.test(normalize(q)); }
export function isExperienceRequiredQuestion(q: string): boolean { return EXPERIENCE_REQUIRED.test(normalize(q)); }
export function isTotalCostQuestion(q: string): boolean { return TOTAL_COST.test(normalize(q)); }
export function isIncludesQuestion(q: string): boolean { return INCLUDES.test(normalize(q)); }
export function mentionsMedia(q: string): boolean { return MEDIA_WORDS.test(normalize(q)); }

export type Intent =
  | "directions" | "pickup" | "location" | "travel_time" | "opening_hours" | "duration"
  | "budget" | "recommendation" | "joint_booking" | "combined_media" | "media"
  | "preparation" | "first_timer" | "experience_required" | "total_cost" | "includes";

export function detectIntents(q: string): Intent[] {
  const t = normalize(q);
  const found: Intent[] = [];
  const add = (cond: boolean, intent: Intent) => { if (cond) found.push(intent); };
  add(isDirectionsQuestion(t), "directions");
  add(isPickupQuestion(t), "pickup");
  add(isLocationQuestion(t), "location");
  add(isTravelTimeQuestion(t), "travel_time");
  add(isOpeningHoursQuestion(t), "opening_hours");
  add(isDurationOrAltitudeQuestion(t), "duration");
  add(isBudgetQuestion(t), "budget");
  add(isRecommendationRequest(t), "recommendation");
  add(isJointBookingQuestion(t), "joint_booking");
  add(isCombinedMediaQuestion(t), "combined_media");
  add(mentionsMedia(t), "media");
  add(isPreparationQuestion(t), "preparation");
  add(isFirstTimerQuestion(t), "first_timer");
  add(isExperienceRequiredQuestion(t), "experience_required");
  add(isTotalCostQuestion(t), "total_cost");
  add(isIncludesQuestion(t), "includes");
  return found;
}

export interface QuestionPart {
  text: string;

  isQuestion: boolean;
  intents: Intent[];
}

const QUESTION_WORD = "can|could|do|does|did|is|are|am|will|would|should|shall|may|might|what|how|which|where|when|why|who|whose|whom|any|if";

const CLAUSE_BREAK = new RegExp(`\\s*(?:[;,]\\s*(?:and|also|plus|but|then)?|\\s(?:and|also|plus|but|and also))\\s+(?=(?:${QUESTION_WORD})\\b)`, "i");
const STARTS_AS_QUESTION = new RegExp(`^\\s*(?:(?:and|also|so|but|okay|ok|well|then|plus)\\b[ ,]*)*(?:${QUESTION_WORD})\\b`, "i");

export function splitQuestionParts(message: string): QuestionPart[] {
  const text = message.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const parts: string[] = [];
  for (const sentence of sentences) {
    const pieces = /\?|^\s*(?:and\s+|also\s+)?(?:can|could|do|does|is|are|will|would|should|what|how|which|where|when)\b/i.test(sentence)
      ? sentence.split(CLAUSE_BREAK)
      : [sentence];
    for (const piece of pieces) {
      const cleaned = piece.trim().replace(/^[,;]\s*/, "");
      if (cleaned) parts.push(cleaned);
    }
  }
  return parts.map((part) => ({
    text: part,
    isQuestion: part.includes("?") || STARTS_AS_QUESTION.test(part),
    intents: detectIntents(part),
  }));
}

export function questionsOf(message: string): QuestionPart[] {
  const parts = splitQuestionParts(message);
  const questions = parts.filter((p) => p.isQuestion);
  return questions.length ? questions : parts;
}