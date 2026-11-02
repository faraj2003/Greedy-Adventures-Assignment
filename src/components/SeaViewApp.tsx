"use client";

import { useEffect, useRef, useState } from "react";
import type { JumpStat } from "@/lib/facts";
import type { Pkg } from "@/lib/packages";
import type { PriceMap } from "@/data/site";
import { useChatDialog } from "@/hooks/useChatDialog";
import { useHashView } from "@/hooks/useHashView";
import { useKnowledgeView } from "@/hooks/useKnowledgeView";
import { useSelectedPackage } from "@/hooks/useSelectedPackage";
import { ChatDialog } from "@/components/ChatDialog";
import { KnowledgeView } from "@/components/knowledge/KnowledgeView";
import { CtaSection } from "@/components/site/CtaSection";
import { ExperienceSection } from "@/components/site/ExperienceSection";
import { GoodToKnowSection } from "@/components/site/GoodToKnowSection";
import { HeroSection } from "@/components/site/HeroSection";
import { PackagesSection } from "@/components/site/PackagesSection";
import { PlanSection } from "@/components/site/PlanSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StatsSection } from "@/components/site/StatsSection";

interface Props {
  /** Formatted package prices, read from lib/facts.ts on the server. */
  prices: PriceMap;
  /** Jump-at-a-glance numbers, read from lib/facts.ts on the server. */
  stats: JumpStat[];
}

export function SeaViewApp({ prices, stats }: Props) {
  const view = useHashView();
  const dialog = useChatDialog();
  const { selected, select } = useSelectedPackage();
  const [heroPick, setHeroPick] = useState<Pkg>("vip");
  const knowledge = useKnowledgeView(view === "knowledge");
  const mainRef = useRef<HTMLElement>(null);
  const firstView = useRef(true);

  // On a view change (link click, Back/Forward) start at the top and move focus into the new content.
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  const handlePackageSelect = (pkg: Pkg) => {
    select(pkg);
    setHeroPick(pkg);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader view={view} onOpenChat={dialog.openChat} />

      <main data-chat-inert ref={mainRef} tabIndex={-1} className={`outline-none ${view === "knowledge" ? "min-h-screen bg-mist" : ""}`}>
        {view === "experience" ? (
          <>
            <HeroSection prices={prices} pick={heroPick} onPick={handlePackageSelect} onOpenChat={dialog.openChat} />
            <StatsSection stats={stats} />
            <ExperienceSection />
            <PackagesSection prices={prices} selected={selected} onSelect={handlePackageSelect} />
            <PlanSection />
            <GoodToKnowSection />
            <CtaSection onOpenChat={dialog.openChat} />
            <SiteFooter />
          </>
        ) : (
          <KnowledgeView knowledge={knowledge} />
        )}
      </main>

      <ChatDialog dialog={dialog} packageContext={selected} onTraceUpdated={knowledge.rememberTrace} />
    </div>
  );
}
