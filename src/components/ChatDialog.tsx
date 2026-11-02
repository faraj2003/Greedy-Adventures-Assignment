"use client";

import { MessageCircle, X } from "lucide-react";
import { AssistantChat } from "@/components/AssistantChat";
import type { useChatDialog } from "@/hooks/useChatDialog";
import type { Pkg } from "@/lib/packages";
import type { BackendActivityTrace } from "@/lib/types";

interface Props {
  dialog: ReturnType<typeof useChatDialog>;
  packageContext: Pkg | null;
  onTraceUpdated: (trace: BackendActivityTrace) => void;
}

/** Floating concierge dialog plus its launcher. The chat itself is mounted on first open. */
export function ChatDialog({ dialog, packageContext, onTraceUpdated }: Props) {
  const { open, mounted, closeChat, toggleChat, launcherRef, panelRef } = dialog;
  return (
    <>
      <div
        ref={panelRef}
        id="concierge-chat"
        role="dialog"
        aria-modal="true"
        aria-label="Concierge chat"
        aria-hidden={!open}
        tabIndex={-1}
        className={[
          "fixed inset-x-2 bottom-[5.5rem] z-50 h-[min(700px,calc(100dvh-7rem))] overflow-hidden rounded-[22px] outline-none",
          "border border-line bg-white shadow-float sm:inset-x-auto sm:bottom-24 sm:right-8",
          "sm:h-[min(720px,calc(100dvh-8rem))] sm:w-[420px]",
          open ? "animate-pop" : "hidden",
        ].join(" ")}
      >
        {mounted && <AssistantChat onTraceUpdated={onTraceUpdated} onClose={closeChat} packageContext={packageContext} />}
      </div>

      <button
        ref={launcherRef}
        type="button"
        onClick={toggleChat}
        aria-expanded={open}
        aria-controls="concierge-chat"
        aria-label={open ? "Close concierge chat" : "Open concierge chat"}
        className="fixed bottom-5 right-4 z-50 flex h-14 items-center gap-2.5 rounded-full bg-ink py-2 pl-2 pr-6 text-sm font-semibold text-white shadow-float transition-colors hover:bg-brand-deep sm:right-8"
      >
        <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </span>
        {open ? "Close" : "Ask the concierge"}
      </button>
    </>
  );
}
