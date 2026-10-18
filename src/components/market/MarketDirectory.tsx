"use client";

import { useState } from "react";
import { PlaceList } from "@/components/place/PlaceList";
import { PlaceRow } from "@/components/place/PlaceRow";
import { FilterChips } from "@/components/ui/FilterChips";
import { Notice } from "@/components/ui/Notice";
import { SearchBox } from "@/components/ui/SearchBox";
import { Section } from "@/components/ui/Section";
import type { Place } from "@/types/place";
import { toBnDigits } from "@/utils/bangla";
import type { Clock } from "@/utils/hours";
import { groupShops, matchesQuery } from "@/utils/place";
import { ancestorsOf, childMarkets, shopsUnder, type PlaceTree } from "@/utils/place-tree";
import { describePurpose, purposeStats } from "@/utils/purposes";

const SEARCH_FROM = 6;

interface MarketDirectoryProps {
  market: Place;
  tree: PlaceTree;
  clock: Clock;
}

export function MarketDirectory({ market, tree, clock }: MarketDirectoryProps) {
  const [purpose, setPurpose] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const subMarkets = childMarkets(tree, market.id);
  const shops = shopsUnder(tree, market.id);
  const stats = purposeStats(market, shops);
  const depth = ancestorsOf(tree, market).length + 1;
  const sectionOf = (shop: Place) =>
    ancestorsOf(tree, shop)
      .slice(depth)
      .map((a) => a.name)
      .join(" · ");

  const visible = shops.filter(
    (shop) => (!purpose || shop.purposes.some((p) => p.id === purpose)) && matchesQuery(shop, query),
  );

  return (
    <>
      {stats.length > 0 && (
        <Section title="কিসের জন্য">
          <FilterChips
            label="কিসের জন্য"
            options={stats.map((s) => ({ value: s.id, label: describePurpose(s) }))}
            value={purpose}
            onChange={setPurpose}
          />
        </Section>
      )}

      {subMarkets.length > 0 && (
        <Section title={`ভেতরের মার্কেট (${toBnDigits(subMarkets.length)})`}>
          <PlaceList
            places={subMarkets}
            clock={clock}
            empty=""
            noteOf={(m) => `${toBnDigits(shopsUnder(tree, m.id).length)}টা দোকান`}
          />
        </Section>
      )}

      <Section title={`দোকান (${toBnDigits(shops.length)})`}>
        {shops.length >= SEARCH_FROM && (
          <div className="px-4 pb-1">
            <SearchBox value={query} onChange={setQuery} label="দোকান খুঁজুন" placeholder="দোকানের নাম বা জিনিস" />
          </div>
        )}
        {!visible.length && (
          <Notice>{shops.length ? "এই খোঁজে কোনো দোকান নেই।" : "এখনো কোনো দোকান যোগ হয়নি।"}</Notice>
        )}
        {groupShops(visible, sectionOf).map(([label, list]) => (
          <div key={label}>
            <h3 className="px-4 pt-3 text-sm font-semibold text-dim">{label}</h3>
            <ul>
              {list.map((shop) => (
                <PlaceRow key={shop.id} place={shop} clock={clock} />
              ))}
            </ul>
          </div>
        ))}
      </Section>
    </>
  );
}
