import Image from "next/image";
import { Check } from "lucide-react";
import type { Pkg } from "@/lib/packages";
import { INCLUDED_IN_ALL, PACKAGES, priceLabel, type PriceMap } from "@/data/site";

interface Props {
  prices: PriceMap;
  selected: Pkg | null;
  onSelect: (pkg: Pkg) => void;
}

export function PackagesSection({ prices, selected, onSelect }: Props) {
  return (
      <section id="packages" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pb-6 pt-24 sm:px-8 sm:pt-32">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-brand-deep">Choose your package</p>
            <h2 className="mt-3 max-w-xl text-balance font-display text-4xl leading-[1.06] tracking-[-0.02em] sm:text-[3.2rem]">
              Same jump. Pick how much of it you take home.
            </h2>
          </div>
          <p className="max-w-md text-base text-slate-soft sm:text-lg">
            Every package uses the same aircraft, altitude and instructors. The only difference is the media.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PACKAGES.map((item) => {
            const Icon = item.media.icon;
            const isSelected = selected === item.id;
            const dark = item.id === "vip";

            return (
              <article
                key={item.id}
                className={`flex flex-col rounded-[22px] p-3 transition-colors ${
                  dark ? "bg-ink text-white" : "border border-line bg-white"
                } ${isSelected ? (dark ? "ring-2 ring-brand ring-offset-2 ring-offset-paper" : "!border-brand ring-2 ring-brand/25") : ""}`}
              >
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-mist">
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
                </div>

                <div className="flex flex-1 flex-col px-3 pb-3 pt-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[1.9rem] leading-none">{item.name}</h3>
                    <p className={`tnum text-right ${dark ? "text-white" : "text-ink"}`}>
                      <span className="text-2xl font-bold tracking-tight">{priceLabel(prices, item.id)}</span>
                      <span className={`ml-1 text-xs ${dark ? "text-white/60" : "text-slate-soft"}`}>/ person</span>
                    </p>
                  </div>
                  <p className={`mt-3 flex items-center gap-2 text-sm font-medium ${dark ? "text-white/85" : "text-ink/80"}`}>
                    <Icon className={`h-4 w-4 shrink-0 ${dark ? "text-white/70" : "text-brand"}`} aria-hidden="true" />
                    {item.media.label}
                  </p>

                  <ul className={`mt-6 space-y-2.5 border-t pt-6 text-sm ${dark ? "border-white/15 text-white/85" : "border-line text-ink/80"}`}>
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-white" : "text-go"}`} strokeWidth={2.4} aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className={`mt-6 text-sm leading-relaxed ${dark ? "text-white/65" : "text-slate-soft"}`}>{item.note}</p>

                  <div className="mt-auto pt-7">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-colors ${
                      dark
                        ? isSelected ? "bg-brand text-white" : "bg-white text-ink hover:bg-brand-tint"
                        : isSelected ? "bg-brand text-white" : "bg-ink text-white hover:bg-brand"
                    }`}
                  >
                    {isSelected ? (<><Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" /> Selected</>) : `Choose ${item.name}`}
                  </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 rounded-[22px] bg-mist p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-center">
            <div>
              <h3 className="font-display text-xl">Included in every package</h3>
              <p className="mt-1 text-sm text-slate-soft">Same aircraft, same altitude, same instructors.</p>
            </div>
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              {INCLUDED_IN_ALL.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-go" strokeWidth={2.6} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
  );
}
