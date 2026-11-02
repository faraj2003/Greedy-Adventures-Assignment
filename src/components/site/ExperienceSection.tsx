import Image from "next/image";
import { GALLERY } from "@/data/site";

export function ExperienceSection() {
  return (
      <section className="mx-auto max-w-[1240px] px-4 pb-6 pt-24 sm:px-8 sm:pt-32">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-brand-deep">The experience</p>
            <h2 className="mt-3 max-w-xl text-balance font-display text-4xl leading-[1.06] tracking-[-0.02em] sm:text-[3.2rem]">
              A different kind of blue horizon.
            </h2>
          </div>
          <div className="max-w-md space-y-3 text-base text-slate-soft">
            <p>
              From the aircraft climb to the moment your parachute opens, every part of the day gives you a new view of Thailand&rsquo;s coastline.
            </p>
            <p>
              No previous skydiving experience is required. Your tandem instructor takes care of the jump while you take in the view.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-6 sm:auto-rows-[9.5rem] sm:grid-cols-12 sm:gap-y-4">
          {GALLERY.map((item, i) => (
            <figure key={item.src} className={`flex flex-col ${i === 0 ? "col-span-2" : ""} ${item.area}`}>
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-mist aspect-[4/3] sm:aspect-auto">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={i === 0 ? "(max-width: 640px) 100vw, 700px" : "(max-width: 640px) 50vw, 480px"}
                  className={`object-cover ${item.pos}`}
                />
              </div>
              <figcaption className="mt-2.5 text-[13px] leading-snug text-slate-soft">
                <span className="font-semibold text-ink">{item.title}.</span> {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
  );
}
