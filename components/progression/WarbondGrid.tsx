"use client";

/**
 * WarbondGrid — renders a grid of WarbondItems for one or more pages.
 * Shows page header (name, blurb, level requirement, lock state) and
 * delegates each item to <WarbondItemCard>. Items can be filtered by
 * type and unlock state via the `filter` prop.
 *
 * Props:
 *   pageId?      — render only this page; otherwise renders all pages
 *   onUnlock     — called with a WarbondItem.id when the user clicks an
 *                  unlock button on a locked card
 *   filter       — "all" | "stratagem" | "cosmetic" | "title" | etc.
 */

import clsx from "clsx";
import {
  WARBOND_PAGES,
  getWarbondPage,
} from "@/systems/progression/data/warbonds";
import {
  WarbondPage,
  WarbondItem,
} from "@/systems/progression/progressionTypes";
import { useProgression } from "@/hooks/useProgression";
import { WarbondItemCard } from "./cards";

interface Props {
  pageId?: string;
  filter?: WarbondItem["type"] | "all";
  onUnlockSuccess?: (item: WarbondItem) => void;
  className?: string;
}

export default function WarbondGrid({ pageId, filter = "all", onUnlockSuccess, className }: Props) {
  const { profile, unlockWarbondItem } = useProgression();
  const pages: WarbondPage[] = pageId
    ? ([getWarbondPage(pageId)].filter(Boolean) as WarbondPage[])
    : WARBOND_PAGES;

  const isStratagemUnlocked = (item: WarbondItem) =>
    item.type === "stratagem" && !!item.refId && profile.unlockedStratagems.includes(item.refId);
  const isCosmeticUnlocked = (item: WarbondItem) =>
    item.type !== "stratagem" && !!item.refId && profile.unlockedCosmetics.includes(item.refId);
  const isItemUnlocked = (item: WarbondItem) =>
    isStratagemUnlocked(item) || isCosmeticUnlocked(item);

  const canAfford = (item: WarbondItem) =>
    (item.cost.medals ?? 0) <= profile.currencies.medals &&
    (item.cost.requisition ?? 0) <= profile.currencies.requisition &&
    (!item.levelRequired || profile.level >= item.levelRequired);

  return (
    <div className={clsx("flex flex-col gap-6", className)}>
      {pages.map((page) => {
        const items = filter === "all" ? page.items : page.items.filter((i) => i.type === filter);
        const pageLocked = profile.level < page.levelRequired;
        return (
          <section
            key={page.id}
            className={clsx(
              "border bg-bg-primary/60 p-3 font-mono",
              pageLocked && "opacity-50",
            )}
            style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
          >
            {/* Page header */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-widest text-text-dim">
                    TIER {page.tier}
                  </span>
                  <h3
                    className="text-sm font-display font-black uppercase tracking-widest"
                    style={{ color: "var(--color-accent-yellow, #f5c542)" }}
                  >
                    {page.name}
                  </h3>
                </div>
                <p className="text-[10px] text-text-dim mt-0.5">{page.blurb}</p>
              </div>
              <div className="text-right">
                {pageLocked ? (
                  <span
                    className="inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 border font-black"
                    style={{ color: "var(--color-accent-red, #ff4d4d)", borderColor: "var(--color-accent-red, #ff4d4d)", borderRadius: 1 }}
                  >LOCKED · L{page.levelRequired}</span>
                ) : (
                  <span className="text-[9px] uppercase tracking-widest text-text-dim">
                    L{page.levelRequired}+
                  </span>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((item) => (
                <WarbondItemCard
                  key={item.id}
                  item={item}
                  unlocked={isItemUnlocked(item)}
                  affordable={canAfford(item) && !pageLocked}
                  onUnlock={() => {
                    if (pageLocked) return;
                    const ok = unlockWarbondItem(item.id);
                    if (ok) onUnlockSuccess?.(item);
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
