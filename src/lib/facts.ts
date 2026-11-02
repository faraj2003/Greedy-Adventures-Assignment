import { KNOWLEDGE_SOURCES } from "./knowledge";
import { Pkg, PACKAGE_ORDER } from "./packages";

export const LABEL: Record<Pkg, string> = { eco: "ECO", deluxe: "DELUXE", vip: "VIP" };

export const baht = (n: number): string => `฿${n.toLocaleString("en-US")}`;

const sourceText = (id: string): string => KNOWLEDGE_SOURCES.find((s) => s.id === id)?.text ?? "";
const allText = (): string => KNOWLEDGE_SOURCES.map((s) => s.text).join("\n\n");

export interface PackageFact {
  pkg: Pkg;
  label: string;
  price: number | null;
  tagline: string | null;

  description: string[];

  booking: string[];
}

let cache: Record<Pkg, PackageFact> | null = null;

export function packageFacts(): Record<Pkg, PackageFact> {
  if (cache) return cache;
  const main = sourceText("src-sea-view-main");
  const booking = sourceText("src-booking-page");
  const out = {} as Record<Pkg, PackageFact>;
  for (const pkg of PACKAGE_ORDER) {
    const label = LABEL[pkg];
    let price: number | null = null;
    let tagline: string | null = null;
    let description: string[] = [];
    const head = new RegExp(`^${label}\\s*[—–-]\\s*฿\\s*([\\d,]+)[^\\n]*:\\s*\\n((?:[^\\n]+\\n?)*)`, "m").exec(main);
    if (head) {
      price = Number(head[1].replace(/,/g, ""));
      const lines = head[2].split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines[0]?.startsWith('"')) tagline = lines.shift()!.replace(/^"|"$/g, "").replace(/\.$/, "");
      description = lines;
    }
    const b = new RegExp(`^${label}:\\s*\\n((?:[^\\n]+\\n?)*)`, "m").exec(booking);
    const bookingLines = b ? b[1].split("\n").map((l) => l.trim()).filter(Boolean) : [];
    if (price === null) {
      const p = bookingLines.find((l) => /^price:/i.test(l))?.match(/฿\s*([\d,]+)/);
      if (p) price = Number(p[1].replace(/,/g, ""));
    }
    out[pkg] = { pkg, label, price, tagline, description, booking: bookingLines.filter((l) => /^(includes?|does not include)/i.test(l)) };
  }
  cache = out;
  return out;
}

export const priceOf = (pkg: Pkg): number | null => packageFacts()[pkg].price;
export const pricesKnown = (): boolean => PACKAGE_ORDER.every((p) => priceOf(p) !== null);

export function packageSummary(pkg: Pkg): string {
  const f = packageFacts()[pkg];
  const seen = new Set<string>();
  const parts: string[] = [];
  const words = (l: string): string[] => l.toLowerCase().match(/[a-z]+/g)?.map((w) => w.replace(/s$/, "")) ?? [];
  const IGNORE = new Set(["include", "doe", "does", "not", "certificate", "media", "camera", "the", "and", "from", "a", "with"]);
  const known = new Set<string>(f.description.flatMap(words));
  for (const line of [...f.description, ...f.booking]) {
    const key = line.toLowerCase().replace(/[^a-z]/g, "");
    if (!key || seen.has(key)) continue;

    const isBooking = f.booking.includes(line);
    if (isBooking && f.description.length && words(line).every((w) => known.has(w) || IGNORE.has(w))) continue;
    seen.add(key);
    parts.push(line.replace(/\.$/, ""));
  }
  return parts.join(". ");
}

export function packageHasMedia(pkg: Pkg): boolean {
  return !/no cameras|does not include camera/i.test([...packageFacts()[pkg].description, ...packageFacts()[pkg].booking].join(" "));
}

export function blockLines(sourceId: string, header: string): string[] {
  const wanted = header.toLowerCase();
  for (const block of sourceText(sourceId).split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || !lines[0].toLowerCase().startsWith(`${wanted}:`)) continue;
    const inline = lines[0].slice(header.length + 1).trim();
    return [inline, ...lines.slice(1).map((l) => l.replace(/^-\s*/, ""))].filter(Boolean);
  }
  return [];
}

export function sourceBlock(sourceId: string, header: string): string | null {
  const lines = blockLines(sourceId, header);
  return lines.length ? lines.join(" ").replace(/\s+/g, " ").trim() : null;
}

export type JumpStatId = "altitude" | "freefall" | "canopy" | "dropzone";

export interface JumpStat {
  id: JumpStatId;
  big: string;
  unit: string;
}

/**
 * The "jump at a glance" numbers, read from the captured Sea View page text so the
 * marketing page and the concierge cannot disagree. A figure that cannot be found is
 * omitted rather than guessed.
 */
export function jumpStats(): JumpStat[] {
  const main = sourceText("src-sea-view-main");
  const stats: JumpStat[] = [];
  const altitude = /exit altitude:\s*([\d,]+)\s*feet/i.exec(main);
  if (altitude) stats.push({ id: "altitude", big: altitude[1], unit: "ft" });
  const freefall = /(\d+)\s*seconds of freefall/i.exec(main);
  if (freefall) stats.push({ id: "freefall", big: freefall[1], unit: "sec" });
  const canopy = /(\d+)\s*to\s*(\d+)\s*minutes under canopy/i.exec(main);
  if (canopy) stats.push({ id: "canopy", big: `${canopy[1]}–${canopy[2]}`, unit: "min" });
  const dropzone = /(approximately|around|about)?\s*(\d+)\s*hours at the dropzone/i.exec(main);
  if (dropzone) stats.push({ id: "dropzone", big: `${dropzone[1] ? "~" : ""}${dropzone[2]}`, unit: "hrs" });
  return stats;
}

export function planSteps(): { title: string; detail: string }[] {
  const steps: { title: string; detail: string }[] = [];
  for (const block of sourceText("src-sea-view-plan").split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const m = /^Step \d+\s*[—–-]\s*(.+?):?$/.exec(lines[0] ?? "");
    if (m) steps.push({ title: m[1], detail: lines.slice(1).join(" ") });
  }
  return steps;
}

export function dropzoneAddress(): string {
  const m = /(95 M\.4,[^\n]*(?:\n[^\n]*Thailand)?)/.exec(sourceText("src-sea-view-main"));
  const raw = m ? m[1] : "95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand";
  return raw.replace(/\s+/g, " ").replace(/\.$/, "").trim();
}

export function whatsappNumber(): string | null {
  const m = /(\+\d[\d ]{8,})/.exec(sourceText("src-booking-faq"));
  return m ? m[1].replace(/\.$/, "").trim() : null;
}

export function findSentence(pattern: RegExp): string | null {
  const joined = allText().replace(/([^.:!?\n])\n(?=[^\n-])/g, "$1 ");
  for (const raw of joined.split(/(?<=\.)\s+|\n+/)) {
    const line = raw.replace(/^-\s*/, "").trim();
    if (line && pattern.test(line)) return line.replace(/\.$/, "");
  }
  return null;
}

export const hasFact = (...needles: string[]): boolean => {
  const t = allText().toLowerCase();
  return needles.every((n) => t.includes(n.toLowerCase()));
};

export interface OrderLine { pkg: Pkg; qty: number }

export interface Total {
  lines: { pkg: Pkg; qty: number; unit: number; subtotal: number }[];
  total: number;
  text: string;
}

export function computeTotal(items: OrderLine[]): Total | null {
  const merged = new Map<Pkg, number>();
  for (const it of items) merged.set(it.pkg, (merged.get(it.pkg) ?? 0) + it.qty);
  const lines: Total["lines"] = [];
  for (const pkg of PACKAGE_ORDER) {
    const qty = merged.get(pkg);
    if (!qty) continue;
    const unit = priceOf(pkg);
    if (unit === null) return null;
    lines.push({ pkg, qty, unit, subtotal: unit * qty });
  }
  if (!lines.length) return null;
  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const text = lines.length === 1
    ? `${lines[0].qty} × ${baht(lines[0].unit)} = ${baht(total)}`
    : `${lines.map((l) => `${l.qty} × ${baht(l.unit)} (${LABEL[l.pkg]})`).join(" + ")} = ${baht(total)}`;
  return { lines, total, text };
}

export function knownBahtAmounts(): Set<number> {
  const set = new Set<number>();
  const re = /฿\s*([\d,]+)/g;
  const t = allText();
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) set.add(Number(m[1].replace(/,/g, "")));
  return set;
}
