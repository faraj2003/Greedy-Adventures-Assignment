import Image from "next/image";
import { MessageCircle } from "lucide-react";

export function CtaSection({ onOpenChat }: { onOpenChat: () => void }) {
  return (
      <section className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-8">
        <div className="relative isolate overflow-hidden rounded-[24px] bg-ink">
          <Image src="/demo/sea-view-sea.jpg" alt="" aria-hidden="true" fill sizes="1240px" className="-z-10 hidden object-cover object-right md:block" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/75 to-transparent" />
          <div className="flex flex-col items-start gap-8 px-8 py-14 sm:px-14 sm:py-20 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white/70">Ready when you are</p>
              <h2 className="mt-3 max-w-md text-balance font-display text-4xl leading-[1.06] tracking-[-0.02em] text-white sm:text-[3.2rem]">
                Your view is waiting.
              </h2>
              <p className="mt-4 max-w-md text-white/80">
                Have a question before choosing? Ask the Sea View concierge.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-ink transition-colors hover:bg-brand-tint"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Ask the concierge
            </button>
          </div>
        </div>
      </section>
  );
}
