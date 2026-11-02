import type { JumpStat } from "@/lib/facts";
import { STAT_CAPTIONS } from "@/data/site";

export function StatsSection({ stats }: { stats: JumpStat[] }) {
  if (!stats.length) return null;
  return (
      <section aria-label="Jump at a glance" className="mx-auto mt-16 max-w-[1240px] px-4 sm:mt-20 sm:px-8">
        <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {stats.map((item, i) => (
            <div
              key={item.id}
              className={[
                "px-1 py-7 sm:py-9 lg:px-8",
                i % 2 === 1 ? "border-l border-line pl-5 sm:pl-8" : "",
                i > 1 ? "border-t border-line lg:border-t-0" : "",
                i > 0 ? "lg:border-l" : "",
                i === 0 ? "lg:pl-0" : "",
              ].join(" ")}
            >
              <dd className="font-display text-[2.6rem] leading-none tracking-tight sm:text-[3.2rem]">
                {item.big}<span className="ml-1.5 text-lg font-medium text-slate-soft sm:text-xl">{item.unit}</span>
              </dd>
              <dt className="mt-3 max-w-[14rem] text-sm text-slate-soft">{STAT_CAPTIONS[item.id]}</dt>
            </div>
          ))}
        </dl>
      </section>
  );
}
