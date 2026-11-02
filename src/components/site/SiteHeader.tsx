import { MessageCircle, Plane } from "lucide-react";
import { KNOWLEDGE_HASH, type SiteView } from "@/hooks/useHashView";

const tabClass = (on: boolean) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 ${
    on ? "bg-white text-ink shadow-soft" : "text-slate-soft hover:text-ink"
  }`;

export function SiteHeader({ view, onOpenChat }: { view: SiteView; onOpenChat: () => void }) {
  return (
    <header data-chat-inert className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-8">
        <a href="#" className="flex items-center gap-2.5 text-ink">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white">
            <Plane className="h-[18px] w-[18px] -rotate-45" strokeWidth={2} />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-display text-[19px] tracking-tight">Greedy Adventures</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-soft">Sea View Skydiving</span>
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-6">
          {view === "experience" && (
            <div className="hidden items-center gap-6 text-sm font-medium text-slate-soft lg:flex">
              <a href="#packages" className="transition-colors hover:text-ink">Packages</a>
              <a href="#plan" className="transition-colors hover:text-ink">Jump day</a>
              <a href="#good-to-know" className="transition-colors hover:text-ink">Good to know</a>
            </div>
          )}
          <nav aria-label="Main navigation" className="flex items-center gap-1 rounded-full bg-mist p-1">
          <a href="#" className={tabClass(view === "experience")} aria-current={view === "experience" ? "page" : undefined}>
            Experience
          </a>
          <a href={KNOWLEDGE_HASH} className={tabClass(view === "knowledge")} aria-current={view === "knowledge" ? "page" : undefined}>
            Knowledge
          </a>
        </nav>
        </div>

        <button
          type="button"
          onClick={onOpenChat}
          className="hidden items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand sm:inline-flex"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Ask the concierge
        </button>
      </div>
    </header>
  );
}
