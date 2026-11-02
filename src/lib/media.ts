import { existsSync } from "node:fs";
import path from "node:path";
import { MediaAsset, MediaType } from "./types";

const PAGE = "https://www.greedyadventures.com/experiences/sea-view-skydiving";

export const MEDIA_REGISTRY: Record<"pdf" | "video" | "link", MediaAsset> = {
  pdf: {
    id: "pdf-sea-view-brochure",
    type: "pdf",
    title: "Sea View Skydiving — Experience Brochure",
    filename: "sea-view-skydiving-brochure-demo.pdf",
    url: "/demo/sea-view-skydiving-brochure-demo.pdf",
    mimeType: "application/pdf",
    sizeOrDuration: "PDF · 1 page · 54 KB",
    isDemoMaterial: true,
    sourceUrl: PAGE,
    description:
      "Printable summary of the 13,000 ft exit, the ECO (฿9,500) / DELUXE (฿12,500) / VIP (฿14,000) package table, the 5-step flight plan and the Dropzone Thailand address.",
  },
  video: {
    id: "video-sea-view-preview",
    type: "video",
    title: "Sea View Skydiving — Preview Clip",
    filename: "sea-view-skydiving-demo.mp4",
    url: "/demo/sea-view-skydiving-demo.mp4",
    poster: "/demo/sea-view-skydiving-demo-poster.jpg",
    mimeType: "video/mp4",
    sizeOrDuration: "MP4 · 0:18 · 960×540 · 0.7 MB",
    isDemoMaterial: true,
    sourceUrl: PAGE,
    description:
      "An 18-second demo clip assembled from the project's still photography with captions taken from the public page. It is demo material, not operator footage.",
  },
  link: {
    id: "link-sea-view-experience",
    type: "link",
    title: "Sea View Skydiving — Official Experience Page",
    url: PAGE,
    sizeOrDuration: "External website",
    isDemoMaterial: false,
    sourceUrl: PAGE,
    description: "Opens the official Sea View Skydiving page on greedyadventures.com in a new tab.",
  },
};

export const ALL_MEDIA: MediaAsset[] = [MEDIA_REGISTRY.pdf, MEDIA_REGISTRY.video, MEDIA_REGISTRY.link];

export interface MediaSelectionDecision {
  selectedMedia: MediaAsset[];
  routerReason: string;
}

const MEDIA_VERBS = /\b(send|share|download|get|open|show|attach|provide|want|need|see|watch|play|view|email|give)\b/;

const DELIVERY_VERBS = /\b(send|share|download|attach|email|watch|play|open|give me|get me|show me)\b/;

const INCLUSION_QUESTION = /\b(includ(?:e|es|ed|ing)|comes? with|come with|get with)\b/;

const KNOWING_PREFIX = new RegExp(
  [
    String.raw`\b(?:(?:want(?:ed)?|need(?:ed)?|would like|'d like|like|trying|hoping) to (?:know|ask|check|`,
    String.raw`find out|understand|confirm|clarify|see (?:if|whether)|check (?:if|whether))|(?:wondering|curious|`,
    String.raw`asking|checking|unsure|not sure|can you (?:tell|confirm)|could you (?:tell|`,
    String.raw`confirm))(?: me)?(?: about)?(?: if| whether)?)\b`,
  ].join(""),
  "g",
);

const PACKAGE_SUBJECT = "(?:eco|deluxe|vip|packages?|options?|tiers?|it)";
const PACKAGE_CONTENT_VERB = "(?:has|have|offers?|includes?|comes? with|provides?|gets?|gives?|features?)";
const PACKAGE_CONTENTS_QUESTION = new RegExp(`\\b(?:does|do|is|are|did|whether|if)\\b[^?.]*\\b${PACKAGE_SUBJECT}\\b[^?.]*\\b${PACKAGE_CONTENT_VERB}\\b`);
const BROCHURE = /\b(brochure|pdf|flyer|pamphlet|leaflet|information sheet|info sheet|fact sheet|document)\b/;
const VIDEO = /\b(video|videos|clip|footage|reel|mp4|recording)\b|\bwatch (?:the |a )?(?:jump|experience|skydive)\b/;
const OFFICIAL_PAGE = /\b(official (?:page|site|website)|experience page|website link|link to (?:the )?(?:page|website|site)|booking page)\b/;

export function selectMediaForQuery(query: string): MediaSelectionDecision {
  const q = query.trim().toLowerCase().replace(/[’‘]/g, "'");

  const qForVerbs = q.replace(KNOWING_PREFIX, " ");
  const asksAboutContents = INCLUSION_QUESTION.test(q) || PACKAGE_CONTENTS_QUESTION.test(q);
  const asksForMedia = MEDIA_VERBS.test(qForVerbs) && !(asksAboutContents && !DELIVERY_VERBS.test(q));

  const wantsBrochure = asksForMedia && BROCHURE.test(q);
  const wantsVideo = asksForMedia && VIDEO.test(q);
  const wantsPage = OFFICIAL_PAGE.test(q) && MEDIA_VERBS.test(qForVerbs);

  const selected: MediaAsset[] = [];
  const reasons: string[] = [];
  if (wantsBrochure) {
    selected.push(MEDIA_REGISTRY.pdf);
    reasons.push("document intent (brochure/PDF) -> bundled demo PDF");
  }
  if (wantsVideo) {
    selected.push(MEDIA_REGISTRY.video);
    reasons.push("video intent (video/clip/footage) -> bundled demo MP4");
  }
  if (wantsPage) {
    selected.push(MEDIA_REGISTRY.link);
    reasons.push("official-page intent -> external experience page link");
  }

  if (!selected.length) {
    return { selectedMedia: [], routerReason: "No media intent detected: text-only grounded response from the public website sources." };
  }
  const prefix = selected.length > 1 ? "Matched combined media intent: " : "Matched ";
  return { selectedMedia: selected, routerReason: `${prefix}${reasons.join("; ")}.` };
}

export function partitionAvailableMedia(
  assets: MediaAsset[],

  forceMissing: MediaType[] = [],
): { available: MediaAsset[]; missing: MediaAsset[] } {
  const publicDir = path.join(process.cwd(), "public");
  const canCheck = existsSync(path.join(publicDir, "demo"));
  const assumeAvailable = process.env.MEDIA_ASSUME_AVAILABLE === "true";
  const available: MediaAsset[] = [];
  const missing: MediaAsset[] = [];
  for (const asset of assets) {
    const isLocal = asset.url.startsWith("/");
    if (forceMissing.includes(asset.type)) missing.push(asset);
    else if (!isLocal || (!canCheck && assumeAvailable) || (canCheck && existsSync(path.join(publicDir, asset.url)))) available.push(asset);
    else missing.push(asset);
  }
  return { available, missing };
}
