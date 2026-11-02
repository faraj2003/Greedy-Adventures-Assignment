"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parsePkg, type Pkg } from "@/lib/packages";

const KEY = "ga-selected-package";

/**
 * The visitor's chosen package, kept for the tab session. Always held as the canonical
 * lowercase id; older saved values ("ECO", "Deluxe", "DELUXE", "VIP") are normalised on read.
 */
export function useSelectedPackage() {
  const [selected, setSelected] = useState<Pkg | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    try {
      const saved = parsePkg(window.sessionStorage.getItem(KEY));
      if (saved) setSelected(saved);
    } catch {
      // storage unavailable: selection just won't persist
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      if (selected) window.sessionStorage.setItem(KEY, selected);
      else window.sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }, [selected]);

  const select = useCallback((pkg: Pkg) => setSelected(pkg), []);
  return { selected, select };
}
