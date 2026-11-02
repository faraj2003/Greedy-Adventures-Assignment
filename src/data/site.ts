import {
  Bus, BadgeCheck, ClipboardCheck, Clapperboard, Clock, MapPin, ShieldCheck, Video, Wind, Waves, Plane,
  type LucideIcon,
} from "lucide-react";
import type { Pkg } from "@/lib/packages";
import type { JumpStatId } from "@/lib/facts";

/**
 * Static marketing copy for the page. Prices and the jump-at-a-glance numbers are NOT here:
 * they come from lib/facts.ts (the captured website text) via the server page, so the page and
 * the concierge always quote the same figures.
 */

export interface PackageCard {
  id: Pkg;
  name: string;
  sub: string;
  note: string;
  image: string;
  imageAlt: string;
  badge: string | null;
  media: { icon: LucideIcon; label: string };
  features: string[];
}

export const PACKAGES: PackageCard[] = [
  {
    id: "eco", name: "Eco", sub: "The jump, nothing else.", note: "Just you, your instructor and the view.",
    image: "/demo/sea-view-sea.jpg", imageAlt: "Open turquoise water and islands in the Gulf of Thailand", badge: null,
    media: { icon: ShieldCheck, label: "No photo or video" },
    features: ["13,000 ft tandem jump", "Safety briefing and instructor", "Certificate of completion", "No photo/video media"],
  },
  {
    id: "deluxe", name: "Deluxe", sub: "Handycam video and photos.", note: "Your instructor films the jump, so the memory comes home with you.",
    image: "/demo/sea-view-tandem.jpg", imageAlt: "A tandem pair in freefall above Pattaya bay", badge: null,
    media: { icon: Video, label: "Handycam video and photos" },
    features: ["Everything in ECO", "Instructor-captured handycam video", "Photos from your jump"],
  },
  {
    id: "vip", name: "VIP", sub: "Personal cameraman and edited film.", note: "A cameraman jumps beside you and you get a finished film.",
    image: "/demo/sea-view-canopy.jpg", imageAlt: "A navy and white parachute canopy against a bright blue sky", badge: "Full media coverage",
    media: { icon: Clapperboard, label: "Cameraman and edited film" },
    features: ["Everything in ECO", "Personal cameraman", "Edited film and photos"],
  },
];

/** Formatted baht price per package (from lib/facts.ts), or null if the source text has none. */
export type PriceMap = Record<Pkg, string | null>;
export const priceLabel = (prices: PriceMap, id: Pkg): string => prices[id] ?? "Ask us";

export const STAT_CAPTIONS: Record<JumpStatId, string> = {
  altitude: "Exit altitude over the Pattaya dropzone",
  freefall: "Freefall with the Gulf of Thailand below",
  canopy: "Under canopy, gliding along the coast",
  dropzone: "Plan for this long at the dropzone",
};

export const GALLERY = [
  {
    src: "/demo/sea-view-hero.jpg",
    alt: "A tandem pair beneath a navy parachute above Pattaya bay",
    title: "Over Pattaya bay",
    caption: "The view once the canopy opens.",
    area: "sm:col-span-7 sm:row-span-3",
    pos: "object-[62%_45%]",
  },
  {
    src: "/demo/sea-view-coast.jpg",
    alt: "Pattaya coastline and beach from above",
    title: "The coastline",
    caption: "Beach, bay and city in one frame.",
    area: "sm:col-span-5 sm:row-span-2",
    pos: "object-center",
  },
  {
    src: "/demo/sea-view-canopy.jpg",
    alt: "Navy and white canopy against the sky",
    title: "Under canopy",
    caption: "A slow glide for 5 to 7 minutes.",
    area: "sm:col-span-5 sm:row-span-2",
    pos: "object-[50%_30%]",
  },
  {
    src: "/demo/sea-view-sea.jpg",
    alt: "Turquoise water and islands in the Gulf of Thailand",
    title: "Gulf of Thailand",
    caption: "Islands on the horizon.",
    area: "sm:col-span-7 sm:row-span-2",
    pos: "object-center",
  },
];

export const STEPS = [
  { icon: ClipboardCheck, title: "Arrival and check-in", text: "Sign in at the dropzone and bring your photo ID." },
  { icon: ShieldCheck, title: "Safety briefing and gear fitting", text: "Meet your instructor for the safety briefing and harness fitting." },
  { icon: Plane, title: "Boarding and the climb", text: "Board the aircraft and climb to jump altitude (13,000 ft)." },
  { icon: Wind, title: "Exit and freefall", text: "Exit with your instructor for freefall over the Gulf of Thailand (around 60 seconds)." },
  { icon: Waves, title: "Canopy flight and landing", text: "Fly under the parachute with your instructor (around 5 to 7 minutes) and land back at the dropzone." },
];

export const GOOD_TO_KNOW = [
  { icon: MapPin, title: "Where", text: "Pattaya Sea View, 95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand. Operated by Dropzone Thailand." },
  { icon: Clock, title: "Loads every day", text: "Jump loads run every day of the year. Plan for about 3 hours at the dropzone." },
  { icon: BadgeCheck, title: "Bring photo ID", text: "Bring your photo ID to check-in. No experience is needed, your instructor flies the jump." },
  { icon: Bus, title: "Bangkok pickup", text: "Available as a fixed-price add-on." },
];

export const INCLUDED_IN_ALL = [
  "Tandem skydive in Pattaya, Thailand",
  "Safety briefing and tandem instructor support",
  "Aircraft ascent and ocean-view jump",
  "Certificate of completion",
];

export const DEFAULT_TEST_QUESTION = "What is included in the package?";
