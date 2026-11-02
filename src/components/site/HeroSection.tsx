import Image from "next/image";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import type { Pkg } from "@/lib/packages";
import { PACKAGES, priceLabel, type PriceMap } from "@/data/site";

interface Props {
  prices: PriceMap;
  pick: Pkg;
  onPick: (pkg: Pkg) => void;
  onOpenChat: () => void;
}

export function HeroSection({ prices, pick, onPick, onOpenChat }: Props) {
  const picked = PACKAGES.find((x) => x.id === pick);
  return (
      <section className="mx-auto grid max-w-[1240px] gap-10 px-4 pb-4 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-14 lg:pt-16">
        <div className="flex flex-col justify-center lg:py-6">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-deep">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Pattaya, Thailand · Tandem skydive
          </p>
          <h1 className="mt-5 text-balance font-display text-[2.9rem] leading-[1.02] tracking-[-0.025em] sm:text-6xl lg:text-[4.4rem]">
            The sea is better from up here.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-soft">
            Jump from 13,000 feet above the Pattaya coastline, with the Gulf of Thailand stretching out below you. No experience needed: your instructor handles the jump.
          </p>

          <div className="mt-9 max-w-xl">
            <p className="text-sm font-semibold">Choose your jump</p>
            <div role="group" aria-label="Package" className="mt-3 grid grid-cols-3 gap-2">
              {PACKAGES.map((item) => {
                const on = pick === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onPick(item.id)}
                    aria-pressed={on}
                    className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"
                    }`}
                  >
                    <span className={`block text-xs font-semibold uppercase tracking-[0.1em] ${on ? "text-white/70" : "text-slate-soft"}`}>{item.name}</span>
                    <span className="tnum mt-1 block text-lg font-bold tracking-tight sm:text-xl">{priceLabel(prices, item.id)}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 min-h-[2.75rem] text-[15px] text-slate-soft" aria-live="polite">
              {picked?.sub} {picked?.note}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="#packages"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-deep"
              >
                Compare packages <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-ink hover:bg-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask the concierge
              </button>
            </div>
            <p className="mt-5 text-[13px] text-slate-soft">Prices are per person, in Thai baht.</p>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-ink sm:aspect-[5/5] lg:aspect-auto lg:h-full lg:min-h-[600px]">
            <Image
              src="/demo/sea-view-hero.jpg"
              alt="Tandem skydivers above the Pattaya coastline"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="animate-fade object-cover object-[64%_50%]"
            />
          </div>
          <figure className="absolute -bottom-5 left-4 hidden w-44 overflow-hidden rounded-2xl border-[6px] border-paper bg-ink sm:block lg:-left-10 lg:w-52">
            <div className="relative aspect-[4/3]">
              <Image src="/demo/sea-view-coast.jpg" alt="Pattaya coastline from above" fill sizes="208px" className="object-cover" />
            </div>
          </figure>
          <p className="mt-3 text-right text-[13px] text-slate-soft lg:absolute lg:bottom-4 lg:right-5 lg:mt-0 lg:rounded-full lg:bg-paper/95 lg:px-3 lg:py-1.5 lg:text-ink">
            Over Pattaya bay
          </p>
        </div>
      </section>
  );
}
