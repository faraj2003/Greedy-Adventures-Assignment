"use client";

import { useEffect, useState } from "react";

export type ServiceMode = { mode: "live" | "deterministic"; model: string | null };

// One /api/health request per page load, shared by every chat mount (including "New chat").
let pending: Promise<ServiceMode | null> | null = null;

function fetchMode(): Promise<ServiceMode | null> {
  if (!pending) {
    pending = fetch("/api/health")
      .then((r) => r.json())
      .then((j): ServiceMode | null => (j && (j.mode === "live" || j.mode === "deterministic") ? { mode: j.mode, model: j.model ?? null } : null))
      .catch(() => {
        pending = null; // allow a later retry
        return null;
      });
  }
  return pending;
}

export function useServiceMode(): ServiceMode | null {
  const [info, setInfo] = useState<ServiceMode | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchMode().then((m) => { if (!cancelled) setInfo(m); });
    return () => { cancelled = true; };
  }, []);
  return info;
}
