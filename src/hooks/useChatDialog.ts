"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FOCUSABLE = [
  "a[href]", "button:not([disabled])", "textarea:not([disabled])", "input:not([disabled])",
  "select:not([disabled])", "video[controls]", "summary", "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute("inert") && el.getClientRects().length > 0);
}

/** Elements marked data-chat-inert are made inert (no focus, no clicks, hidden from AT) while the chat is open. */
const INERT_SELECTOR = "[data-chat-inert]";

/**
 * Open/close state and modal behaviour for the concierge dialog: first-open lazy mount, initial
 * focus, a Tab/Shift+Tab focus trap, Escape to close, background made inert, and focus returned
 * to the launcher on close.
 */
export function useChatDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const openChat = useCallback(() => { setMounted(true); setOpen(true); }, []);
  const closeChat = useCallback(() => setOpen(false), []);
  const toggleChat = useCallback(() => { setMounted(true); setOpen((v) => !v); }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) launcherRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const panel = panelRef.current;
    if (!panel) return;

    const background = Array.from(document.querySelectorAll<HTMLElement>(INERT_SELECTOR));
    background.forEach((el) => { el.inert = true; });

    (panel.querySelector<HTMLElement>("textarea, input") ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableIn(panel);
      if (!items.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      background.forEach((el) => { el.inert = false; });
    };
  }, [open]);

  return { open, mounted, openChat, closeChat, toggleChat, launcherRef, panelRef };
}
