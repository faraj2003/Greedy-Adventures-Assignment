import { STEPS } from "@/data/site";

export function PlanSection() {
  return (
      <section id="plan" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pt-24 sm:px-8 sm:pt-32">
        <div className="grid gap-10 rounded-[24px] bg-mist px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-20 lg:px-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-semibold text-brand-deep">From ground to sky</p>
            <h2 className="mt-3 max-w-sm text-balance font-display text-4xl leading-[1.06] tracking-[-0.02em] sm:text-[3.2rem]">
              Here&rsquo;s how jump day goes.
            </h2>
          </div>

          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-6 left-[19px] top-6 w-px bg-ink/20" />
            {STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                  <span aria-hidden="true" className="tnum relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <h3 className="font-display text-lg font-bold leading-snug">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-1 max-w-md text-[15px] text-slate-soft">{step.text}</p>
                  </div>
                  <Icon className="mt-2 hidden h-5 w-5 shrink-0 text-ink/35 sm:block" strokeWidth={1.7} aria-hidden="true" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>
  );
}
