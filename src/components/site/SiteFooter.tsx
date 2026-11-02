import { Plane } from "lucide-react";
import { GOOD_TO_KNOW } from "@/data/site";

export function SiteFooter() {
  return (
      <footer className="border-t border-line bg-mist">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-14 text-sm sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 font-display text-lg">
              <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white">
                <Plane className="h-[18px] w-[18px] -rotate-45" />
              </span>
              Greedy Adventures
            </div>
            <p className="mt-4 text-slate-soft">Sea View Skydiving, Pattaya</p>
          </div>
          <div>
            <div className="font-bold">Where</div>
            <p className="mt-2 max-w-xs text-slate-soft">{GOOD_TO_KNOW[0].text}</p>
          </div>
          <div>
            <div className="font-bold">Open every day</div>
            <p className="mt-2 max-w-xs text-slate-soft">{GOOD_TO_KNOW[1].text}</p>
          </div>
        </div>
      </footer>
  );
}
