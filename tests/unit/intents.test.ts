import { test } from "node:test";
import assert from "node:assert/strict";
import * as I from "../../src/lib/intents";

type Detector = (q: string) => boolean;
interface Table { name: string; fn: Detector; yes: string[]; no: string[] }

const tables: Table[] = [
  {
    name: "isTravelTimeQuestion",
    fn: I.isTravelTimeQuestion,
    yes: ["How long does it take to get there from Bangkok?", "How far is the drive from Pattaya?", "What's the travel time from the airport?", "how long is the journey from my hotel"],
    no: ["How long is the freefall?", "What are the opening hours?", "How much does ECO cost?"],
  },
  {
    name: "isOpeningHoursQuestion",
    fn: I.isOpeningHoursQuestion,
    yes: ["What are your opening hours?", "Are you open on Sunday?", "What time do you close?", "when are you open", "is the dropzone open today"],
    no: ["How long is the jump?", "Where is the dropzone?", "How much is VIP?"],
  },
  {
    name: "isDurationOrAltitudeQuestion",
    fn: I.isDurationOrAltitudeQuestion,
    yes: ["How long is the freefall?", "How high do we jump from?", "What's the exit altitude?", "How long does the experience take?", "How many hours should I plan for?"],
    no: ["What are your opening hours?", "How long does it take to get there from Bangkok?", "How much is ECO?"],
  },
  {
    name: "isDirectionsQuestion",
    fn: I.isDirectionsQuestion,
    yes: ["How do I get to the dropzone?", "Can you give me directions?", "Is there a bus or taxi?", "How can we reach you from Bangkok?", "Do you have a meeting point?"],
    no: ["How much is ECO?", "How long does it take to get there?", "Is there a video?"],
  },
  {
    name: "isPickupQuestion",
    fn: I.isPickupQuestion,
    yes: ["Do you offer hotel pickup?", "Can you pick me up from Bangkok?", "Is there a shuttle?", "Do you do transfers?"],
    no: ["Where is the dropzone?", "What is the weight limit?", "How much is VIP?"],
  },
  {
    name: "isLocationQuestion",
    fn: I.isLocationQuestion,
    yes: ["Where is the dropzone?", "What's your address?", "Is it on Google Maps?", "Where exactly are you located?"],
    no: ["How much is VIP?", "Do you have a brochure?", "How long is the jump?"],
  },
  {
    name: "isBudgetQuestion",
    fn: I.isBudgetQuestion,
    yes: ["What's the cheapest package?", "I'm on a tight budget", "Is there something affordable?", "I don't want to spend too much", "anything under 10000", "best value for money?"],
    no: ["Where is the dropzone?", "Is there a video?", "How long is the freefall?"],
  },
  {
    name: "isRecommendationRequest",
    fn: I.isRecommendationRequest,
    yes: ["Which package do you recommend?", "What should I choose?", "Help me decide", "What's the best package?", "Is it worth it?"],
    no: ["How much is ECO?", "Where is the dropzone?", "Is there a brochure?"],
  },
  {
    name: "isJointBookingQuestion",
    fn: I.isJointBookingQuestion,
    yes: ["Can we book together?", "I'm coming with my wife", "There are 3 of us", "Can both of us jump together?", "group of 4"],
    no: ["How much is ECO?", "Where is the dropzone?", "Do you have a video?"],
  },
  {
    name: "isCombinedMediaQuestion",
    fn: I.isCombinedMediaQuestion,
    yes: ["Can our videos be combined in one?", "Can we get both videos in one file?", "Can you merge our footage?"],
    no: ["Can I see a video?", "How much is the video package?", "Where is the dropzone?"],
  },
  {
    name: "isPreparationQuestion",
    fn: I.isPreparationQuestion,
    yes: ["Do I need training?", "Can I just turn up and jump?", "What should I do before the jump?", "Is there a practice session?"],
    no: ["How much is ECO?", "Where is the dropzone?", "Do you have a video?"],
  },
  {
    name: "isFirstTimerQuestion",
    fn: I.isFirstTimerQuestion,
    yes: ["I'm nervous", "This is my first time", "I've never skydived", "Is it suitable for a beginner?", "I'm scared of heights"],
    no: ["How much is ECO?", "Where is the dropzone?", "What is included in VIP?"],
  },
  {
    name: "isExperienceRequiredQuestion",
    fn: I.isExperienceRequiredQuestion,
    yes: ["Do I need previous experience?", "Is experience required?", "Do I need any experience?", "Is prior experience needed?"],
    no: ["How much is ECO?", "Where is the dropzone?", "Is there a video?"],
  },
  {
    name: "isTotalCostQuestion",
    fn: I.isTotalCostQuestion,
    yes: ["What's the total for 3 people?", "How much for both of us?", "How much would it cost altogether?", "2 x VIP"],
    no: ["Where is the dropzone?", "Is there a brochure?", "How long is the freefall?"],
  },
  {
    name: "isIncludesQuestion",
    fn: I.isIncludesQuestion,
    yes: ["What's included?", "What does VIP include?", "What do I get?", "What comes with DELUXE?"],
    no: ["Where is the dropzone?", "How long is the jump?", "Are you open on Sunday?"],
  },
  {
    name: "mentionsMedia",
    fn: I.mentionsMedia,
    yes: ["Can I get photos?", "Is there a GoPro?", "Do you film it?", "Do I get a video?", "Is there a cameraman?"],
    no: ["How much is ECO?", "Where is the dropzone?", "How long is the jump?"],
  },
];

for (const { name, fn, yes, no } of tables) {
  test(name, async (t) => {
    for (const q of yes) await t.test(`detects: ${q}`, () => assert.equal(fn(q), true, q));
    for (const q of no) await t.test(`ignores: ${q}`, () => assert.equal(fn(q), false, q));
    await t.test("handles curly apostrophes like straight ones", () => {
      for (const q of yes) assert.equal(fn(q.replace(/'/g, "’")), true, q);
    });
  });
}

test("mentionsOrigin", async (t) => {
  const cases: [string, string | null][] = [
    ["I'm coming from Bangkok", "bangkok"],
    ["Flying into Suvarnabhumi", "suvarnabhumi"],
    ["Pick me up at my hotel", "my hotel"],
    ["from the airport", "the airport"],
    ["Where is the dropzone?", null],
  ];
  for (const [q, expected] of cases) await t.test(q, () => assert.equal(I.mentionsOrigin(q), expected));
});

test("mediaNeeds", async (t) => {
  const cases: [string, Partial<I.MediaNeeds>][] = [
    ["Do I get a video?", { video: true, photos: false, none: false }],
    ["Can I get photos?", { photos: true, video: false }],
    ["I want a video and photos", { video: true, photos: true }],
    ["Is there a cameraman?", { premium: true }],
    ["I don't need any photos", { none: true, photos: false }],
    ["No video please", { none: true, video: false }],
    ["Just the jump", { none: true }],
    ["How much is ECO?", { video: false, photos: false, premium: false, none: false }],
  ];
  for (const [q, expected] of cases) {
    await t.test(q, () => assert.deepEqual({ ...I.mediaNeeds(q), ...expected }, I.mediaNeeds(q)));
  }
});

test("detectIntents aggregates detectors", async (t) => {
  const cases: [string, I.Intent[], I.Intent[]][] = [
    ["How do I get to the dropzone from Bangkok?", ["directions"], ["budget"]],
    ["What are your opening hours?", ["opening_hours"], ["duration", "travel_time"]],
    ["How long is the freefall?", ["duration"], ["opening_hours", "travel_time"]],
    ["What's the cheapest package, and is there a video?", ["budget", "media"], ["opening_hours"]],
    ["I'm nervous, do I need any experience?", ["first_timer", "experience_required"], ["budget"]],
    ["Hello", [], ["directions", "budget", "media", "includes"]],
  ];
  for (const [q, has, lacks] of cases) {
    await t.test(q, () => {
      const got = I.detectIntents(q);
      for (const i of has) assert.ok(got.includes(i), `expected ${i} in ${got.join(",")}`);
      for (const i of lacks) assert.ok(!got.includes(i), `did not expect ${i} in ${got.join(",")}`);
    });
  }
});

test("splitQuestionParts / questionsOf", async (t) => {
  await t.test("empty input yields no parts", () => assert.deepEqual(I.splitQuestionParts("   "), []));
  await t.test("splits two questions and tags each with intents", () => {
    const parts = I.splitQuestionParts("Where is the dropzone? How much is VIP?");
    assert.equal(parts.length, 2);
    assert.ok(parts[0].isQuestion && parts[0].intents.includes("location"));
    assert.ok(parts[1].isQuestion);
  });
  await t.test("splits 'X, and what about Y' clauses", () => {
    const parts = I.splitQuestionParts("Is there a video, and what are the opening hours?");
    assert.equal(parts.length, 2);
    assert.ok(parts[1].intents.includes("opening_hours"));
  });
  await t.test("questionsOf drops non-question statements", () => {
    const q = I.questionsOf("I am coming on Friday. Where is the dropzone?");
    assert.equal(q.length, 1);
    assert.match(q[0].text, /dropzone/);
  });
  await t.test("questionsOf falls back to all parts when none is a question", () => {
    assert.equal(I.questionsOf("I am coming on Friday.").length, 1);
  });
});
