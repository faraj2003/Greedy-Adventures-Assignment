"use client";

import { useSyncExternalStore } from "react";

export type SiteView = "experience" | "knowledge";

/** The Knowledge dashboard lives at /#knowledge so Back, Forward and deep links work. */
export const KNOWLEDGE_HASH = "#knowledge";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const getSnapshot = (): SiteView => (window.location.hash === KNOWLEDGE_HASH ? "knowledge" : "experience");
const getServerSnapshot = (): SiteView => "experience";

/** Current view derived from the URL hash. In-page anchors such as #packages stay on "experience". */
export function useHashView(): SiteView {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
