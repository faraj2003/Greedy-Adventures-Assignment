import {
  detectIntents,
  Intent,
  isDurationOrAltitudeQuestion,
  isOpeningHoursQuestion,
} from "./intents";
import { topicOf } from "./patterns";
import { KnowledgeSource, RetrievedSourceChunk } from "./types";

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [

  {
    id: "src-sea-view-main",
    title: "Sea View Skydiving — Tandem Jump over Pattaya | Greedy Adventures",
    url: "https://www.greedyadventures.com/experiences/sea-view-skydiving",
    captureDate: "2026-10-31",
    category: "Primary Experience & Packages",
    text: `
Sea View Skydiving — Tandem Jump over Pattaya.

Operated by Dropzone Thailand at Pattaya Sea View,
95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand.

The experience:
- Exit altitude: 13,000 feet.
- Around 60 seconds of freefall.
- Approximately 5 to 7 minutes under canopy along the coast.
- Approximately 3 hours at the dropzone.
- No previous skydiving experience is needed.
- A USPA-certified instructor handles the jump.
- The Gulf of Thailand is visible on the jump.

Every package includes:
- Tandem skydive experience in Pattaya, Thailand.
- Safety briefing and tandem instructor support.
- Aircraft ascent and ocean-view jump experience.
- Certificate of completion.

All packages use the same aircraft, altitude and instructors.
The difference between packages is the included media.

ECO — ฿9,500 per person:
"The jump, nothing else."
Standard tandem jump with no cameras.

DELUXE — ฿12,500 per person:
"Video and photos included."
Handycam video and photos from the instructor.

VIP — ฿14,000 per person:
"Personal cameraman and edited film."
Full media coverage from a personal cameraman.

Bangkok pickup is available as a fixed-price add-on.

The Sea View experience is a tandem skydive.
The participant is attached to an instructor.
    `.trim(),
  },

  {
    id: "src-sea-view-plan",
    title: "Sea View Skydiving — The Plan & Good to Know | Greedy Adventures",
    url: "https://www.greedyadventures.com/experiences/sea-view-skydiving#the-plan",
    captureDate: "2026-10-31",
    category: "Dropzone Flow & FAQs",
    text: `
The Sea View Skydiving experience follows these steps.

Step 1 — Arrival and check-in:
Sign in at the dropzone and bring photo identification.

Step 2 — Safety briefing and gear fitting:
Meet the instructor for the safety briefing and harness fitting.

Step 3 — Boarding and the climb:
Board the aircraft and climb to jump altitude.

Step 4 — Exit and freefall:
Exit the aircraft with the instructor for freefall over the Gulf of Thailand.

Step 5 — Canopy flight and landing:
Fly under the parachute with the instructor and land back at the dropzone.

Sea View experience details:
- Time at the dropzone: approximately 3 hours.
- Exit altitude: 13,000 feet.
- Freefall: approximately 60 seconds.
- Canopy flight: approximately 5 to 7 minutes.
- Location: Pattaya, Thailand.

Package guidance:
- ECO: choose this for the standard tandem jump.
- DELUXE: choose this if you want handycam video and photos.
- VIP: choose this for full media coverage.

Bangkok pickup is available as a fixed-price add-on.
    `.trim(),
  },

  {
    id: "src-pattaya-dropzone",
    title: "Adventures in Pattaya Dropzone | Greedy Adventures",
    url: "https://www.greedyadventures.com/escapes/thailand/pattaya",
    captureDate: "2026-10-31",
    category: "Pattaya Dropzone",
    text: `
Pattaya Dropzone, Thailand.

The dropzone is described as one of the busiest dropzones in the region.

Loads run every day of the year.
The exit is straight out over the Gulf of Thailand.
The landing area is a two-minute walk from the packing shed.

Instructor languages:
- English.
- Hindi.
- Thai.

Sea View Skydiving:
- Tandem jump over Pattaya.
- Approximately 3 hours at the dropzone.
- Exit altitude: 13,000 feet.
- Around 60 seconds of freefall.
- Canopy flight along the coastline.

ECO package:
The cheapest way to experience freefall.
No cameras and no media extras are included.

The Sea View jump is the same across packages.
The package difference is the media included.
    `.trim(),
  },

  {
    id: "src-company-overview",
    title: "Greedy Adventures — Tandem Skydiving in Thailand and India",
    url: "https://www.greedyadventures.com/",
    captureDate: "2026-10-31",
    category: "Brand & Dropzone Overview",
    text: `
Greedy Adventures helps people arrange adventure experiences.

The company offers tandem skydiving experiences in Thailand and India.

Thailand:
Sea View Skydiving — Pattaya, over the Gulf of Thailand.
Approximately 3 hours at the dropzone.

India:
Tandem Skydive — Mount Abu, Rajasthan.

Customers can choose an experience and send a booking request.
The team confirms the slot with the customer.

Paragliding, scuba diving and snowboarding are listed as coming soon.
They should not be represented as currently active experiences.
    `.trim(),
  },

  {
    id: "src-skydiving-overview",
    title: "Skydiving — Tandem Skydiving in Thailand and India | Greedy Adventures",
    url: "https://www.greedyadventures.com/adventures/skydiving",
    captureDate: "2026-11-01",
    category: "Skydiving Basics & Equipment",
    text: `
Skydiving is an adventure activity in which a person exits
an aircraft at altitude, experiences freefall and then
descends under a parachute.

A tandem skydive is designed for first-time jumpers.
The participant is harnessed to an instructor who handles
the jump, including the exit, freefall and landing.

No previous skydiving experience is needed for a tandem jump.

A ground briefing explains the required body position
and the process of the jump.

General skydiving information:
The general overview describes approximately 45 seconds
of freefall and approximately five minutes under canopy.

IMPORTANT:
These are general figures.
They should not override the Sea View-specific figures.
For Sea View Skydiving in Pattaya, use approximately
60 seconds of freefall and 5 to 7 minutes under canopy.

The equipment described includes:
- Main parachute.
- Reserve parachute.
- Reserve packed and certified by a rigger.
- Automatic activation device.
- Four-point tandem harness.
- Altimeter.

The instructor checks and tightens the harness before
boarding and again in the aircraft.

A second jumper can film the jump.
Camera options depend on the selected package.
    `.trim(),
  },

  {
    id: "src-pattaya-faq",
    title: "Pattaya Dropzone — Location, FAQs and Practical Information | Greedy Adventures",
    url: "https://www.greedyadventures.com/escapes/thailand/pattaya",
    captureDate: "2026-11-01",
    category: "Pattaya Location & Practical FAQs",
    text: `
Pattaya Dropzone is in Pattaya, Thailand.

Loads run every day of the year.
The exit is over the Gulf of Thailand.
The landing area is a two-minute walk from the packing shed.

Instructors speak:
- English.
- Hindi.
- Thai.

Sea View Skydiving:
- Tandem jump from 13,000 feet.
- Approximately 60 seconds of freefall.
- Canopy flight along the coastline.
- Approximately 3 hours at the dropzone.

Clothing recommendations:
- Wear trainers.
- Wear comfortable clothing.
- Do not wear sandals.
- Avoid loose jewellery.

Camera restrictions:
Participants may not use their own GoPro or other camera
unless appropriately licensed.

Unlicensed jumpers are not allowed to carry cameras
because of safety requirements.

Media options are available through the applicable packages.

The dropzone operates throughout the year.
Actual jumps remain dependent on safe weather conditions.
    `.trim(),
  },

  {
    id: "src-booking-faq",
    title: "Contact Greedy Adventures — Booking, Eligibility and Frequently Asked Questions",
    url: "https://www.greedyadventures.com/contact",
    captureDate: "2026-11-01",
    category: "Booking, Eligibility & Weather",
    text: `
Tandem skydiving experience requirements:

Previous experience:
No previous experience is needed for a tandem skydive.

Instructor:
The participant is harnessed to an instructor who handles
the exit, freefall and landing.

Briefing:
A ground briefing takes approximately 20 minutes.

Minimum age:
Participants must be at least 18 years old.

Identification:
Participants must bring valid photo identification.

Weight:
The tandem weight limit is 100 kg.
Weight should also be proportional to height for harness fit.
People close to the limit should contact the team before booking.

Booking:
Send the preferred date to the team on WhatsApp.
Request a slot and wait for availability confirmation.

Payment:
The contact FAQ states that advance payment is not required.
Payment is made at the dropzone on the day.
Booking requests are subject to confirmation.

Weather:
Skydiving depends on wind and cloud conditions.
If a load is held, participants may wait for another
weather window on the same day or move to another date.
Jumps do not proceed in unsafe conditions.

Time:
Budget approximately 3 to 4 hours at the dropzone.
This includes check-in, briefing, gear fitting, flight,
jump and collecting media.

Contact:
WhatsApp is the recommended contact method.
The website states that the team usually replies
within an hour or a few hours.

The website lists this contact number:
+91 95357 68554.

IMPORTANT:
Do not promise a confirmed booking until the team confirms it.
Do not guarantee that a jump will operate in bad weather.
    `.trim(),
  },

  {
    id: "src-terms",
    title: "Greedy Adventures — Terms and Conditions",
    url: "https://www.greedyadventures.com/terms",
    captureDate: "2026-11-01",
    category: "Terms, Safety & Payment",
    text: `
Greedy Adventures arranges activities with operators
who deliver the activities.

The operator named on the package page runs the activity.
The operator's safety rules, weight limits and medical
requirements apply on the day.

Booking:
Booking slots are held on request.
A booking request does not automatically mean
the booking is confirmed.

Payment:
The website does not use a cart or payment gateway.
Card details are not entered on the website.
Payment is made directly to the operator at the dropzone
on the day unless a package page says otherwise.

Multi-day trips and courses with fixed departure dates
may require a deposit if stated and agreed in writing.

Eligibility:
Tandem skydiving participants must be at least 18 years old.
Participants must bring valid photo identification.
The tandem skydiving weight limit is 100 kg.

Medical information:
Participants must declare relevant medical information,
including heart conditions, respiratory conditions,
recent surgery, pregnancy or regular medication.

The chatbot must not decide whether an individual
is medically fit to skydive.
Refer individual medical suitability questions to the operator.

Alcohol and drugs:
Anyone under the influence of alcohol or drugs
is not permitted to participate.

Safety:
The activity depends on weather and conditions.
The instructor or pilot can delay, shorten, stop an activity
or decline a participant on safety grounds.

Media:
Media is normally handed over on the same day.
If equipment fails and no usable footage exists,
the media portion of the price is refunded.

Waiver:
Participants sign the operator's waiver on the day.

Adventure sports carry inherent risk.

IMPORTANT:
Do not invent a general cancellation or refund policy.
Only explain refund conditions explicitly stated in the terms.
    `.trim(),
  },

  {
    id: "src-booking-page",
    title: "Book Skydiving — Sea View Tandem Skydive, Pattaya",
    url: "https://booking.greedyadventures.com/",
    captureDate: "2026-11-01",
    category: "Booking Form & Package Inclusions",
    text: `
The booking page is for Sea View Tandem Skydive in Pattaya.

Packages:

ECO:
Price: ฿9,500 per person.
Includes the jump and certificate.
Does not include camera media.

DELUXE:
Price: ฿12,500 per person.
Includes handycam video and certificate.

VIP:
Price: ฿14,000 per person.
Includes cameraman video, photos and edited film.

The booking request asks for:
- Email address.
- WhatsApp number.
- Skydiving date.
- Pickup time.
- Hotel or pickup location.
- Passenger full name as written in passport.
- Package selection.
- Gender.
- Age.
- Weight in kilograms.
- Passport photo.

Passport image formats:
JPG, PNG, WebP or PDF.
Maximum file size: 4 MB.

More than one passenger can be added.

Submitting the form sends a booking request.
The team confirms availability through WhatsApp.

IMPORTANT:
Submitting a booking form is not the same as receiving
a confirmed booking.
    `.trim(),
  },

  {
    id: "src-homepage",
    title: "Greedy Adventures — Tandem Skydiving in Thailand and India",
    url: "https://www.greedyadventures.com/",
    captureDate: "2026-11-01",
    category: "Company Overview & Destinations",
    text: `
Greedy Adventures helps first-time jumpers arrange
tandem skydives in Thailand and India.

Sea View Skydiving:
Pattaya, Thailand, over the Gulf of Thailand.

Tandem Skydive:
Mount Abu, Rajasthan, India.

Customers can choose an experience, send a booking request
and wait for the team to confirm the slot.

The company helps customers understand the experience
before they travel.

Paragliding, scuba diving and snowboarding are listed
as coming soon, not currently active experiences.

Customers can ask about the briefing, equipment
and requirements before travelling.
    `.trim(),
  },
];

const MIN_RELEVANCE = 0.2;
const RELATIVE_CUTOFF = 0.35;
const MAX_SOURCES = 4;

const SYNONYMS: Record<string, string[]> = {
  pictures: ["photos"],
  picture: ["photos"],
  pics: ["photos"],
  images: ["photos"],
  image: ["photos"],
  snaps: ["photos"],
  footage: ["video"],
  clip: ["video"],
  film: ["video"],
  movie: ["video"],
  gopro: ["video", "camera"],
  cameraman: ["cameraman", "video"],
  videographer: ["cameraman"],
  filmed: ["video"],
  filmmaker: ["cameraman"],
  recording: ["video"],
  recordings: ["video"],

  cost: ["price"],
  costs: ["price"],
  pay: ["price", "payment"],
  fee: ["price"],
  charge: ["price"],
  rate: ["price"],
  baht: ["price"],
  thb: ["price"],
  cheapest: ["eco", "price"],
  budget: ["eco", "price"],
  basic: ["eco"],
  standard: ["eco"],
  middle: ["deluxe"],
  premium: ["vip"],
  top: ["vip"],
  expensive: ["vip", "price"],

  address: ["location"],
  dropzone: ["location"],
  map: ["location"],
  find: ["location"],
  rayong: ["location"],
  pattaya: ["location"],
  thailand: ["location"],
  directions: ["location"],

  duration: ["freefall", "canopy", "minutes"],
  minutes: ["freefall", "canopy"],
  seconds: ["freefall"],
  long: ["duration"],
  altitude: ["13000", "exit"],
  height: ["altitude"],
  high: ["altitude"],
  feet: ["13000"],
  ft: ["13000"],
  falling: ["freefall"],
  fall: ["freefall"],
  airborne: ["freefall", "canopy"],
  air: ["freefall", "canopy"],
  parachute: ["canopy"],
  gliding: ["canopy"],
  glide: ["canopy"],
  landing: ["canopy"],
  plane: ["aircraft"],
  airplane: ["aircraft"],
  flight: ["aircraft"],

  instructor: ["instructor"],
  guide: ["instructor"],
  teacher: ["instructor"],
  uspa: ["instructor"],
  novice: ["experience"],
  beginner: ["experience"],
  beginners: ["experience"],
  newbie: ["experience"],
  first: ["experience"],
  tandem: ["instructor", "experience"],
  skydive: ["skydiving", "tandem"],
  jumping: ["jump", "freefall"],
  parachuting: ["parachute", "canopy"],

  certificate: ["certificate"],
  certification: ["certificate"],
  souvenir: ["certificate"],

  hotel: ["pickup"],
  transfer: ["pickup"],
  shuttle: ["pickup"],
  ride: ["pickup"],
  bangkok: ["pickup"],

  age: ["18", "adult", "requirements"],
  weight: ["100", "kg", "limit"],
  limit: ["requirements", "weight"],
  eligible: ["requirements", "age", "weight"],
  eligibility: ["requirements", "age", "weight"],
  medical: ["health", "condition", "requirements"],
  pregnant: ["pregnancy", "medical"],
  pregnancy: ["medical", "health"],
  medication: ["medical", "health"],
  illness: ["medical", "health"],
  surgery: ["medical", "health"],
  safety: ["instructor", "equipment", "reserve"],
  risk: ["safety", "waiver"],

  booking: ["reservation", "request", "slot"],
  reserve: ["booking", "slot"],
  reservation: ["booking", "request"],
  payment: ["pay", "price"],
  advance: ["payment"],
  deposit: ["payment"],
  passport: ["identification", "photo"],
  id: ["identification", "photo"],

  weather: ["wind", "cloud", "conditions"],
  rain: ["weather", "conditions"],
  windy: ["wind", "weather"],
  delay: ["weather", "wait"],
  postpone: ["weather", "date"],
  reschedule: ["date", "weather"],

  clothes: ["trainers", "sandals", "jewellery"],
  clothing: ["trainers", "sandals"],
  wear: ["clothes", "trainers"],
  shoes: ["trainers"],
  footwear: ["trainers"],
  sandals: ["clothes"],
  jewellery: ["clothes"],

  schedule: ["plan", "steps"],
  procedure: ["plan", "steps"],
  process: ["plan", "steps"],
  expect: ["plan", "steps"],
};

const PHRASE_EXPANSIONS: [RegExp, string[]][] = [

  [
    /\b(in the air|time (?:i|we) (?:spend|am|are)|spend(?:ing)? falling|how (?:long|much time)\b[^?]*\b(?:fall|fly|float|glide|descend|air))/,
    ["freefall", "canopy", "seconds", "minutes"],
  ],

  [
    /\b(how (?:fast|quick)|speed|terminal velocity)\b/,
    ["freefall", "seconds"],
  ],

  [
    /\b(what(?:'s| is)? (?:included|in the package)|what do i get|what comes with|worth (?:it|the money)|difference between)\b/,
    ["includes", "package"],
  ],

  [
    /\b(be filmed|get filmed|record(?:ed|ing)? (?:me|my jump)|take (?:a )?(?:video|photos?)|capture)\b/,
    ["video", "photos", "cameraman"],
  ],

  [
    /\b(can i get|do you have|provide|include).*\b(pictures|photos|images|video|footage)\b/,
    ["video", "photos", "cameraman"],
  ],

  [
    /\b(where (?:is|are|do) (?:you|we|i)|how (?:do i|to) get (?:there|to)|meeting point)\b/,
    ["location", "dropzone"],
  ],

  [
    /\b(what happens|walk me through|day of|on the day|what to expect)\b/,
    ["plan", "steps"],
  ],

  [
    /\b(open|closed?|hours|days a week|every day|daily)\b/,
    ["every day", "loads"],
  ],

  [
    /\b(what is|what's|define|meaning of|explain)\b.*\b(skydiving|skydive|tandem)\b/,
    ["skydiving", "tandem", "parachute"],
  ],

  [
    /\b(first time|never done|beginner|new to skydiving|need experience)\b/,
    ["first-time", "instructor", "experience"],
  ],

  [
    /\b(how does skydiving work|how does a jump work)\b/,
    ["aircraft", "freefall", "canopy", "instructor"],
  ],

  [
    /\b(how old|minimum age|age limit|under 18|18 years)\b/,
    ["age", "18", "identification"],
  ],

  [
    /\b(weight limit|how much can i weigh|maximum weight|100 kg)\b/,
    ["weight", "100", "requirements"],
  ],

  [
    /\b(medical condition|health condition|pregnant|medication|surgery)\b/,
    ["medical", "health", "requirements"],
  ],

  [
    /\b(book|booking|reserve|reservation|available slot)\b/,
    ["booking", "request", "slot"],
  ],

  [
    /\b(pay in advance|advance payment|when do i pay|deposit)\b/,
    ["payment", "operator", "dropzone"],
  ],

  [
    /\b(bad weather|rain|wind|cloud|weather delay|reschedule)\b/,
    ["weather", "wind", "conditions", "date"],
  ],

  [
    /\b(what should i wear|clothing|shoes|footwear)\b/,
    ["trainers", "clothes", "sandals", "jewellery"],
  ],

  [
    /\b(own camera|bring.*gopro|use.*camera)\b/,
    ["camera", "licensed", "safety"],
  ],

  [
    /\b(refund|refunds|cancel|cancellation|cancelled)\b/,
    ["refund", "terms", "conditions"],
  ],

  [
    /\b(alcohol|drugs|drunk|intoxicated)\b/,
    ["alcohol", "drugs", "safety"],
  ],

  [
    /\b(waiver|liability|risk)\b/,
    ["waiver", "risk", "safety"],
  ],
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "you",
  "your",
  "are",
  "can",
  "could",
  "would",
  "what",
  "when",
  "where",
  "which",
  "who",
  "how",
  "does",
  "do",
  "is",
  "it",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "me",
  "my",
  "please",
  "tell",
  "show",
  "about",
  "with",
  "from",
  "that",
  "this",
  "there",
  "their",
  "they",
  "i",
  "we",
  "us",
  "be",
  "or",
  "as",
  "at",
  "if",
  "more",
  "much",
  "than",
  "am",
  "get",
  "got",
  "have",
  "has",
  "any",
  "some",
  "will",
  "should",
  "me",
  "our",
  "yourself",
  "myself",
  "please",
]);

function stem(term: string): string {
  if (term.length > 5 && term.endsWith("ing")) {
    return term.slice(0, -3);
  }

  if (term.length > 4 && term.endsWith("es")) {
    return term.slice(0, -2);
  }

  if (
    term.length > 3 &&
    term.endsWith("s") &&
    !term.endsWith("ss")
  ) {
    return term.slice(0, -1);
  }

  return term;
}

export function expandQueryTerms(
  query: string,
  carryoverPackage?: string | null
): string[] {
  const combined = `${query} ${carryoverPackage || ""}`
    .toLowerCase()
    .replace(/[’‘]/g, "'");

  const base = combined
    .split(/[^a-z0-9,']+/)
    .filter(
      (term) =>
        term.length > 1 && !STOP_WORDS.has(term)
    );

  const expanded = new Set<string>();

  for (const term of base) {
    expanded.add(term);
    expanded.add(stem(term));

    for (const synonym of
      SYNONYMS[term] ?? SYNONYMS[stem(term)] ?? []) {
      expanded.add(synonym);
    }
  }

  for (const [pattern, extraTerms] of PHRASE_EXPANSIONS) {
    if (pattern.test(combined)) {
      extraTerms.forEach((term) => expanded.add(term));
    }
  }

  return [...expanded].filter(
    (term) => term.length > 2 || /^\d/.test(term)
  );
}

/**
 * Scoring weights for retrieveSourcesForQuery. Every number the scorer uses lives here.
 * Scores are additive, then capped at MAX_SCORE and filtered by MIN_RELEVANCE / RELATIVE_CUTOFF.
 */
const TERM_MATCH_SCORE = {
  /** Added once per query term found anywhere in a source (title, category or text). */
  inBody: 0.14,
  /** Added on top when the term is also in the source's title or category. */
  inTitle: 0.12,
} as const;
const MAX_SCORE = 0.99;

/** Named boost ladder shared by keyword rules and intent rules, strongest first. */
const BOOST = {
  decisive: 0.7,
  strong: 0.65,
  high: 0.6,
  elevated: 0.55,
  medium: 0.5,
  moderate: 0.45,
  some: 0.4,
  low: 0.35,
  minor: 0.3,
  slight: 0.25,
  hint: 0.2,
} as const;

const SRC = {
  main: "src-sea-view-main",
  plan: "src-sea-view-plan",
  bookingPage: "src-booking-page",
  bookingFaq: "src-booking-faq",
  dropzone: "src-pattaya-dropzone",
  dropzoneFaq: "src-pattaya-faq",
  overview: "src-skydiving-overview",
  company: "src-company-overview",
  terms: "src-terms",
} as const;

/** Intent boosts: which sources an intent points at, and how strongly. */
const INTENT_SOURCES: Partial<Record<Intent, Record<string, number>>> = {
  directions: { [SRC.main]: BOOST.decisive, [SRC.bookingPage]: BOOST.moderate, [SRC.plan]: BOOST.minor },
  location: { [SRC.main]: BOOST.decisive, [SRC.bookingPage]: BOOST.low, [SRC.dropzone]: BOOST.hint },
  pickup: { [SRC.main]: BOOST.decisive, [SRC.bookingPage]: BOOST.medium, [SRC.plan]: BOOST.minor },
  travel_time: { [SRC.main]: BOOST.high, [SRC.bookingPage]: BOOST.low },
  budget: { [SRC.main]: BOOST.decisive, [SRC.bookingPage]: BOOST.low },
  recommendation: { [SRC.main]: BOOST.decisive, [SRC.bookingPage]: BOOST.low, [SRC.plan]: BOOST.hint },
  joint_booking: { [SRC.bookingPage]: BOOST.decisive, [SRC.main]: BOOST.medium, [SRC.bookingFaq]: BOOST.minor },
  combined_media: { [SRC.main]: BOOST.high, [SRC.terms]: BOOST.medium, [SRC.bookingPage]: BOOST.some },
  total_cost: { [SRC.main]: BOOST.decisive, [SRC.bookingPage]: BOOST.some },
  includes: { [SRC.main]: BOOST.high, [SRC.bookingPage]: BOOST.some },
  first_timer: { [SRC.bookingFaq]: BOOST.decisive, [SRC.overview]: BOOST.medium, [SRC.dropzoneFaq]: BOOST.some, [SRC.dropzone]: BOOST.hint },
  preparation: { [SRC.bookingFaq]: BOOST.decisive, [SRC.dropzoneFaq]: BOOST.medium, [SRC.overview]: BOOST.some, [SRC.terms]: BOOST.slight },
  experience_required: { [SRC.bookingFaq]: BOOST.high, [SRC.overview]: BOOST.some },
};

interface ScoringContext {
  /** Lower-cased query plus carried-over package, apostrophes normalised. */
  text: string;
  asksDuration: boolean;
  asksOpeningHours: boolean;
}

interface BoostRule {
  sourceId: string;
  boost: number;
  applies: (ctx: ScoringContext) => boolean;
}

const mentions = (re: RegExp) => (ctx: ScoringContext): boolean => re.test(ctx.text);

const PACKAGE_WORDS = topicOf("package", "packages", "price", "prices", "cost", "costs", "cheap\\w*", "expensive", "options?", "compare", "comparison", "difference", "includ\\w*", "how much", "upgrade", "best value", "eco", "deluxe", "vip", "baht", "9500", "12500", "14000");
const MEDIA_WORDS = topicOf("vip", "cameraman", "edited", "film", "photo", "photos", "pictures", "video", "handycam", "footage", "camera");
const PLAN_WORDS = topicOf("step", "steps", "plan", "id", "arrive", "arrival", "pickup", "bangkok", "where", "location", "address");
const COMPANY_WORDS = topicOf("scuba", "paragliding", "snowboard", "india", "mount abu");
const DROPZONE_WORDS = topicOf("language", "english", "hindi", "thai", "busiest", "landing area");
const DEFINITION_WORDS = topicOf("what is", "what's", "define", "meaning", "explain");
const SKYDIVE_WORDS = topicOf("skydiving", "skydive", "tandem");
const BEGINNER_WORDS = topicOf("beginner", "first time", "experience", "how does.*work");
const ELIGIBILITY_WORDS = topicOf("age", "old", "weight", "kg", "medical", "health", "pregnan", "medication", "surgery", "eligible", "eligibility");
const WEATHER_WORDS = topicOf("weather", "wind", "cloud", "rain", "delay", "postpone", "reschedule");
const BOOKING_WORDS = topicOf("book", "booking", "reservation", "reserve", "payment", "pay", "deposit", "advance", "slot");
const BOOKING_FORM_WORDS = topicOf("book", "booking", "reservation", "reserve", "form", "passenger");
const TERMS_WORDS = topicOf("terms", "conditions", "waiver", "risk", "liability", "refund", "cancel", "cancellation", "alcohol", "drugs");
const CLOTHING_WORDS = topicOf("wear", "clothes", "clothing", "shoes", "trainers", "sandals", "jewellery", "gopro", "camera", "own camera");

/** Keyword boosts. Order matters only for floating-point summation and is kept stable. */
const BOOST_RULES: BoostRule[] = [
  { sourceId: SRC.main, boost: BOOST.elevated, applies: mentions(PACKAGE_WORDS) },
  { sourceId: SRC.main, boost: BOOST.minor, applies: mentions(MEDIA_WORDS) },
  { sourceId: SRC.main, boost: BOOST.high, applies: (c) => c.asksDuration },
  { sourceId: SRC.plan, boost: BOOST.slight, applies: (c) => c.asksDuration },
  { sourceId: SRC.plan, boost: BOOST.moderate, applies: (c) => !c.asksDuration && PLAN_WORDS.test(c.text) },
  { sourceId: SRC.dropzone, boost: BOOST.high, applies: (c) => c.asksOpeningHours },
  { sourceId: SRC.company, boost: BOOST.moderate, applies: mentions(COMPANY_WORDS) },
  { sourceId: SRC.dropzone, boost: BOOST.moderate, applies: mentions(DROPZONE_WORDS) },
  { sourceId: SRC.overview, boost: BOOST.decisive, applies: (c) => DEFINITION_WORDS.test(c.text) && SKYDIVE_WORDS.test(c.text) },
  { sourceId: SRC.overview, boost: BOOST.low, applies: mentions(BEGINNER_WORDS) },
  { sourceId: SRC.bookingFaq, boost: BOOST.strong, applies: mentions(ELIGIBILITY_WORDS) },
  { sourceId: SRC.terms, boost: BOOST.slight, applies: mentions(ELIGIBILITY_WORDS) },
  { sourceId: SRC.bookingFaq, boost: BOOST.strong, applies: mentions(WEATHER_WORDS) },
  { sourceId: SRC.bookingFaq, boost: BOOST.some, applies: mentions(BOOKING_WORDS) },
  { sourceId: SRC.bookingPage, boost: BOOST.moderate, applies: mentions(BOOKING_FORM_WORDS) },
  { sourceId: SRC.terms, boost: BOOST.strong, applies: mentions(TERMS_WORDS) },
  { sourceId: SRC.dropzoneFaq, boost: BOOST.strong, applies: mentions(CLOTHING_WORDS) },
];

function scoreSource(source: KnowledgeSource, terms: string[], ctx: ScoringContext, intents: Set<Intent>): number {
  const title = `${source.title} ${source.category}`.toLowerCase();
  const body = `${source.title} ${source.category} ${source.text}`.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (body.includes(term)) score += TERM_MATCH_SCORE.inBody;
    if (title.includes(term)) score += TERM_MATCH_SCORE.inTitle;
  }
  for (const rule of BOOST_RULES) {
    if (rule.sourceId === source.id && rule.applies(ctx)) score += rule.boost;
  }
  for (const intent of intents) score += INTENT_SOURCES[intent]?.[source.id] ?? 0;
  return Math.min(MAX_SCORE, Number(score.toFixed(2)));
}

export function retrieveSourcesForQuery(
  query: string,
  carryoverPackage?: string | null,
  extraIntents: Intent[] = [],
): RetrievedSourceChunk[] {
  const intents = new Set<Intent>([...detectIntents(query), ...extraIntents]);
  const text = `${query} ${carryoverPackage || ""}`.toLowerCase().replace(/[’‘]/g, "'");
  const terms = expandQueryTerms(query, carryoverPackage);
  const ctx: ScoringContext = { text, asksDuration: isDurationOrAltitudeQuestion(text), asksOpeningHours: isOpeningHoursQuestion(text) };

  const candidates = KNOWLEDGE_SOURCES.map((source) => ({
    sourceId: source.id,
    title: source.title,
    url: source.url,
    captureDate: source.captureDate,
    score: scoreSource(source, terms, ctx, intents),
    passedText: source.text,
  }))
    .filter((source) => source.score >= MIN_RELEVANCE)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return [];
  const floor = Math.max(MIN_RELEVANCE, candidates[0].score * RELATIVE_CUTOFF);
  return candidates.filter((source) => source.score >= floor).slice(0, MAX_SOURCES);
}
