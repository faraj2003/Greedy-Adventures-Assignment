import { SeaViewApp } from "@/components/SeaViewApp";
import { baht, jumpStats, priceOf } from "@/lib/facts";
import { PACKAGE_ORDER } from "@/lib/packages";
import type { PriceMap } from "@/data/site";

/**
 * Server component. Prices and jump stats are read from lib/facts.ts (the captured website text,
 * the same source the concierge answers from) and handed to the client UI as plain data. That keeps
 * one source of truth for numbers and keeps the knowledge text out of the browser bundle.
 */
export default function SeaViewSkydivingPage() {
  const prices = {} as PriceMap;
  for (const pkg of PACKAGE_ORDER) {
    const price = priceOf(pkg);
    prices[pkg] = price === null ? null : baht(price);
  }
  return <SeaViewApp prices={prices} stats={jumpStats()} />;
}
