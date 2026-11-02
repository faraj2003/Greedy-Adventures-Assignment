// Shared helpers for table-driven keyword/phrase classifiers (see intents.ts and knowledge.ts).

/** Joins phrase patterns into a single word-bounded alternation. */
export const anyOf = (phrases: readonly RegExp[]): string => `\\b(?:${phrases.map((p) => p.source).join("|")})\\b`;

/** Builds a classifier from alternative pattern sources (each already word-bounded). */
export const classifier = (alternatives: string[], flags?: string): RegExp => new RegExp(alternatives.join("|"), flags);

/** Turns plain keywords (or small patterns such as "record(?:ed|ing)?") into a phrase list. */
export const keywords = (...words: string[]): RegExp[] => words.map((w) => new RegExp(w));

/** A case-insensitive, word-bounded matcher for a named keyword list. */
export const topicOf = (...words: string[]): RegExp => classifier([anyOf(keywords(...words))], "i");
