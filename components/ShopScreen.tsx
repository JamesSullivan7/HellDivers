"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import CardView from "./CardView";

const PRICE_HEAL = 60;
const PRICE_HEAL_AMOUNT = 25;
const PRICE_MAX_HP = 120;
const PRICE_MAX_HP_AMOUNT = 8;
const PRICE_REMOVE = 80;

function priceForCard(rarity: "common" | "uncommon" | "rare"): number {
  if (rarity === "rare") return 150;
  if (rarity === "uncommon") return 100;
  return 60;
}

export default function ShopScreen() {
  const {
    rewardChoices,
    account,
    player,
    ownedDeck,
    buyShopCard,
    buyShopHeal,
    buyShopMaxHp,
    removeCardFromDeck,
    leaveShop,
  } = useGame();
  const [removeMode, setRemoveMode] = useState(false);

  const stock = useMemo(() => rewardChoices, [rewardChoices]);
  const canHeal = player.hp < player.maxHp;

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />

      <div className="max-w-5xl mx-auto relative z-10">
        <HudFrame accent="steel" glow className="p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-sky-300 mb-1">
                ▶ Black Market Vendor
              </div>
              <div className="text-3xl font-display font-black tracking-tight">
                MERCHANT OF SUPER EARTH
              </div>
              <div className="text-xs text-gray-300 mt-1 max-w-xl">
                "Cash only, Helldiver. Democracy isn&apos;t free, but it&apos;s on sale."
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">
                Wallet
              </div>
              <div className="font-display font-black text-3xl text-helldiver-yellow">
                {account.medals} <span className="text-xs">MEDALS</span>
              </div>
              <div className="text-[10px] text-helldiver-dim mt-1">
                HP {player.hp} / {player.maxHp}
              </div>
            </div>
          </div>
        </HudFrame>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <HudFrame label="Stratagems for Sale" accent="steel" className="p-4">
            {stock.length === 0 ? (
              <div className="text-helldiver-dim italic text-center py-12">
                Out of stock. The vendor shrugs.
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                {stock.map((card, i) => {
                  const price = priceForCard(card.rarity);
                  const canAfford = account.medals >= price;
                  return (
                    <div key={card.id + i} className="flex flex-col items-center">
                      <motion.div
                        whileHover={canAfford ? { scale: 1.04, y: -4 } : { opacity: 0.85 }}
                        whileTap={canAfford ? { scale: 0.97 } : {}}
                      >
                        <div className={clsx(!canAfford && "opacity-60 grayscale")}>
                          <CardView
                            card={card}
                            onClick={() => {
                              if (!canAfford) {
                                sfx.click();
                                return;
                              }
                              sfx.beacon();
                              buyShopCard(card, price);
                            }}
                          />
                        </div>
                      </motion.div>
                      <div
                        className={clsx(
                          "mt-2 px-3 py-1 border-2 text-[11px] font-display font-black tracking-widest",
                          canAfford
                            ? "border-helldiver-yellow text-helldiver-yellow"
                            : "border-helldiver-red/60 text-helldiver-red/80"
                        )}
                      >
                        {price} M
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </HudFrame>

          <div className="space-y-4">
            <HudFrame label="Field Services" accent="steel" className="p-3">
              <div className="space-y-3">
                <ServiceRow
                  label="Combat Stim"
                  description={`Restore ${PRICE_HEAL_AMOUNT} HP`}
                  price={PRICE_HEAL}
                  disabled={!canHeal || account.medals < PRICE_HEAL}
                  onBuy={() => {
                    sfx.heal();
                    buyShopHeal(PRICE_HEAL, PRICE_HEAL_AMOUNT);
                  }}
                />
                <ServiceRow
                  label="Cybernetic Upgrade"
                  description={`+${PRICE_MAX_HP_AMOUNT} max HP for the run`}
                  price={PRICE_MAX_HP}
                  disabled={account.medals < PRICE_MAX_HP}
                  onBuy={() => {
                    sfx.beacon();
                    buyShopMaxHp(PRICE_MAX_HP, PRICE_MAX_HP_AMOUNT);
                  }}
                />
                <ServiceRow
                  label={removeMode ? "Cancel Removal" : "Stratagem Removal"}
                  description={removeMode ? "Click again to abort" : `Permanently remove a card`}
                  price={removeMode ? 0 : PRICE_REMOVE}
                  disabled={!removeMode && (account.medals < PRICE_REMOVE || ownedDeck.length <= 1)}
                  onBuy={() => {
                    sfx.click();
                    setRemoveMode((m) => !m);
                  }}
                />
              </div>
            </HudFrame>

            {removeMode && (
              <HudFrame label="Select Card to Remove" accent="red" className="p-3">
                <div className="text-[10px] text-helldiver-red mb-2 uppercase tracking-widest">
                  Cost: {PRICE_REMOVE} medals — irreversible
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 text-[11px]">
                  {ownedDeck.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (account.medals < PRICE_REMOVE || ownedDeck.length <= 1) return;
                        sfx.beacon();
                        removeCardFromDeck(PRICE_REMOVE, c.id);
                        setRemoveMode(false);
                      }}
                      className="w-full flex justify-between border-b border-helldiver-steel/40 py-1 px-2 hover:bg-helldiver-red/10 hover:border-helldiver-red transition-colors text-left"
                    >
                      <span className="truncate text-gray-200">{c.name}</span>
                      <span className="text-helldiver-yellow tabular-nums font-bold">
                        {c.cost}R
                      </span>
                    </button>
                  ))}
                </div>
              </HudFrame>
            )}

            <button
              onClick={() => {
                sfx.click();
                leaveShop();
              }}
              className="w-full px-6 py-3 border-2 border-helldiver-yellow text-helldiver-yellow hover:bg-helldiver-yellow hover:text-helldiver-dark font-display font-black uppercase tracking-[0.3em] transition-colors"
            >
              ► Leave Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({
  label,
  description,
  price,
  disabled,
  onBuy,
}: {
  label: string;
  description: string;
  price: number;
  disabled: boolean;
  onBuy: () => void;
}) {
  return (
    <button
      onClick={() => {
        if (disabled) return;
        onBuy();
      }}
      disabled={disabled}
      className={clsx(
        "w-full text-left p-3 border-2 transition-colors",
        disabled
          ? "border-helldiver-steel/40 opacity-50 cursor-not-allowed"
          : "border-helldiver-steel hover:border-sky-400 hover:bg-sky-400/5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-display font-bold uppercase tracking-wider text-sky-300">
          {label}
        </span>
        {price > 0 && (
          <span className="text-[10px] font-display font-black text-helldiver-yellow tabular-nums">
            {price}M
          </span>
        )}
      </div>
      <div className="text-[10px] text-gray-300 leading-snug mt-0.5">
        {description}
      </div>
    </button>
  );
}
