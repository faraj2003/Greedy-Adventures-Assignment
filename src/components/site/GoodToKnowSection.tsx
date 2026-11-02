import { GOOD_TO_KNOW } from "@/data/site";

export function GoodToKnowSection() {
  return (
      <section id="good-to-know" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pb-24 pt-24 sm:px-8 sm:pb-28 sm:pt-32">
        <p className="text-sm font-semibold text-brand-deep">Before you go</p>
        <h2 className="mt-3 max-w-lg text-balance font-display text-4xl leading-[1.06] tracking-[-0.02em] sm:text-[3.2rem]">
          A few useful details.
        </h2>

        <div className="mt-10 grid gap-x-12 sm:grid-cols-2">
          {GOOD_TO_KNOW.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex gap-4 border-t border-line py-7">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-brand" strokeWidth={1.7} aria-hidden="true" />
                <div>
                  <h3 className="font-display text-xl">{item.title}</h3>
                  <p className="mt-1.5 max-w-md text-[15px] text-slate-soft">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
  );
}
