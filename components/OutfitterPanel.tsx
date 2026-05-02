"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  ARMORS,
  WEAPONS,
  BOOSTERS,
  ARMOR_PURCHASE_COST,
  WEAPON_PURCHASE_COST,
  BOOSTER_PURCHASE_COST,
  armorUpgradeCost,
  weaponUpgradeCost,
  boosterUpgradeCost,
  getArmorEffective,
  getWeaponEffective,
  MAX_TIER,
} from "@/lib/loadout";
import HudFrame from "./HudFrame";
import { Armor, Weapon, Booster } from "@/lib/types";
import { getArmorArt, getWeaponArt, getBoosterArt } from "@/lib/artManifest";

const TIER_LABEL: Record<number, string> = {
  1: "MK I",
  2: "MK II",
  3: "MK III",
};

const TIER_COLOR: Record<number, string> = {
  1: "text-helldiver-yellow border-helldiver-yellow",
  2: "text-sky-300 border-sky-400",
  3: "text-purple-300 border-purple-400",
};

const TIER_GLOW: Record<number, string> = {
  1: "",
  2: "shadow-[0_0_18px_rgba(56,189,248,0.4)]",
  3: "shadow-[0_0_24px_rgba(192,132,252,0.55)]",
};

const TIER_RING: Record<number, string> = {
  1: "ring-helldiver-yellow/40",
  2: "ring-sky-400/60",
  3: "ring-purple-400/70",
};

export default function OutfitterPanel() {
  const { account, buyArmor, buyWeapon, buyBooster, upgradeArmor, upgradeWeapon, upgradeBooster } = useGame();

  return (
    <div className="space-y-5">
      {/* Wallet header */}
      <HudFrame label="Outfitter · Quartermaster Acquisitions" accent="yellow" glow className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow">
              ◢ Personal Armory ◣
            </div>
            <div className="text-sm text-gray-300 mt-1 max-w-xl">
              Purchase and upgrade weapons, armor, and boosters. Tier upgrades persist across all runs.
            </div>
          </div>
          <div className="flex gap-3 text-right">
            <Wallet label="Medals" amount={account.medals} color="text-helldiver-yellow" />
            <Wallet label="Samples" amount={account.samples} color="text-sky-400" />
            <Wallet label="Requisition" amount={account.requisition} color="text-helldiver-orange" />
          </div>
        </div>
      </HudFrame>

      {/* Armor */}
      <HudFrame label="Body Armor" accent="steel" className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {ARMORS.map((a) => (
            <ArmorCard
              key={a.id}
              armor={a}
              owned={account.ownedArmors.includes(a.id)}
              tier={account.armorTiers[a.id] ?? 1}
              canBuy={account.medals >= ARMOR_PURCHASE_COST}
              canUpgrade={(currentTier) => account.samples >= armorUpgradeCost(currentTier)}
              onBuy={() => {
                if (buyArmor(a.id)) sfx.beacon();
                else sfx.alert();
              }}
              onUpgrade={() => {
                if (upgradeArmor(a.id)) sfx.beacon();
                else sfx.alert();
              }}
            />
          ))}
        </div>
      </HudFrame>

      {/* Weapons */}
      <HudFrame label="Primary Weapons" accent="steel" className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {WEAPONS.map((w) => (
            <WeaponCard
              key={w.id}
              weapon={w}
              owned={account.ownedWeapons.includes(w.id)}
              tier={account.weaponTiers[w.id] ?? 1}
              canBuy={account.medals >= WEAPON_PURCHASE_COST}
              canUpgrade={(currentTier) => account.samples >= weaponUpgradeCost(currentTier)}
              onBuy={() => {
                if (buyWeapon(w.id)) sfx.beacon();
                else sfx.alert();
              }}
              onUpgrade={() => {
                if (upgradeWeapon(w.id)) sfx.beacon();
                else sfx.alert();
              }}
            />
          ))}
        </div>
      </HudFrame>

      {/* Boosters */}
      <HudFrame label="Boosters" accent="steel" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {BOOSTERS.map((b) => (
            <BoosterCard
              key={b.id}
              booster={b}
              owned={account.ownedBoosters.includes(b.id)}
              tier={account.boosterTiers[b.id] ?? 1}
              canBuy={account.requisition >= BOOSTER_PURCHASE_COST}
              canUpgrade={(currentTier) => account.samples >= boosterUpgradeCost(currentTier)}
              onBuy={() => {
                if (buyBooster(b.id)) sfx.beacon();
                else sfx.alert();
              }}
              onUpgrade={() => {
                if (upgradeBooster(b.id)) sfx.beacon();
                else sfx.alert();
              }}
            />
          ))}
        </div>
      </HudFrame>
    </div>
  );
}

function Wallet({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">{label}</div>
      <div className={clsx("font-display font-black text-2xl tabular-nums", color)}>{amount}</div>
    </div>
  );
}

function TierPips({ tier }: { tier: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: MAX_TIER }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "w-2 h-2 border",
            i < tier
              ? tier === 3
                ? "bg-purple-400 border-purple-400"
                : tier === 2
                  ? "bg-sky-400 border-sky-400"
                  : "bg-helldiver-yellow border-helldiver-yellow"
              : "border-helldiver-steel"
          )}
        />
      ))}
    </div>
  );
}

function StatLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-helldiver-dim uppercase tracking-widest">{label}</span>
      <span className={clsx("font-display font-bold tabular-nums", accent ? "text-helldiver-yellow" : "text-gray-200")}>
        {value}
      </span>
    </div>
  );
}

function ItemFrame({
  children,
  owned,
  tier,
  itemName,
}: {
  children: React.ReactNode;
  owned: boolean;
  tier: number;
  itemName: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={clsx(
        "relative p-4 border-2 bg-helldiver-panel/60 transition-all",
        owned
          ? clsx(TIER_COLOR[tier].split(" ")[1], "ring-1 ring-inset", TIER_RING[tier], TIER_GLOW[tier])
          : "border-helldiver-steel/40 opacity-90"
      )}
    >
      {/* Corner brackets */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-60" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-60" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-60" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-60" />
      {!owned && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] uppercase tracking-widest border border-helldiver-red text-helldiver-red bg-black/60 font-display font-black">
          🔒 Locked
        </div>
      )}
      {owned && (
        <div className={clsx(
          "absolute top-2 right-2 px-1.5 py-0.5 text-[9px] uppercase tracking-widest border bg-black/60 font-display font-black flex items-center gap-1",
          TIER_COLOR[tier]
        )}>
          {TIER_LABEL[tier]} <TierPips tier={tier} />
        </div>
      )}
      <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-1">
        {itemName}
      </div>
      {children}
    </motion.div>
  );
}

function ArmorCard({
  armor,
  owned,
  tier,
  canBuy,
  canUpgrade,
  onBuy,
  onUpgrade,
}: {
  armor: Armor;
  owned: boolean;
  tier: number;
  canBuy: boolean;
  canUpgrade: (tier: number) => boolean;
  onBuy: () => void;
  onUpgrade: () => void;
}) {
  const eff = getArmorEffective(armor.id, tier);
  const isMaxTier = tier >= MAX_TIER;
  const upCost = isMaxTier ? Infinity : armorUpgradeCost(tier);
  const art = getArmorArt(armor.id);
  return (
    <ItemFrame owned={owned} tier={tier} itemName="Body Armor · Standard Issue">
      {/* Cinematic art — same source the Codex uses, full-bleed via
          object-cover + object-top so the helldiver's silhouette stays
          framed even on shorter rows. */}
      <div
        className="relative w-full overflow-hidden mb-2 mt-1"
        style={{ height: 150, background: "rgba(7,11,16,0.85)", border: "1px solid rgba(255,199,44,0.18)" }}
      >
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-helldiver-yellow/30 text-3xl">⚙</div>
        )}
        <div
          aria-hidden
          className="absolute left-0 right-0 bottom-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 100%)" }}
        />
      </div>

      <div className="font-display font-black text-base tracking-tight text-white mb-2 leading-tight">
        {armor.name}
      </div>
      <div className="text-[10px] text-gray-300 leading-snug mb-3 italic">
        {armor.passive}
      </div>
      <div className="space-y-1 mb-3 border-t border-helldiver-steel/40 pt-2">
        <StatLine label="Max HP Mod" value={eff.hpMod >= 0 ? `+${eff.hpMod}` : `${eff.hpMod}`} accent={eff.hpMod !== 0} />
        <StatLine label="Starting Block" value={`+${eff.startingBlock}`} accent={eff.startingBlock > 0} />
        <StatLine label="Hand Mod" value={eff.handMod >= 0 ? `+${eff.handMod}` : `${eff.handMod}`} accent={eff.handMod !== 0} />
      </div>
      <ActionButtons
        owned={owned}
        isMaxTier={isMaxTier}
        canBuy={canBuy}
        canUpgrade={canUpgrade(tier)}
        buyCost={ARMOR_PURCHASE_COST}
        buyCurrency="medals"
        upgradeCost={upCost}
        upgradeCurrency="samples"
        onBuy={onBuy}
        onUpgrade={onUpgrade}
      />
    </ItemFrame>
  );
}

function WeaponCard({
  weapon,
  owned,
  tier,
  canBuy,
  canUpgrade,
  onBuy,
  onUpgrade,
}: {
  weapon: Weapon;
  owned: boolean;
  tier: number;
  canBuy: boolean;
  canUpgrade: (tier: number) => boolean;
  onBuy: () => void;
  onUpgrade: () => void;
}) {
  const eff = getWeaponEffective(weapon.id, tier);
  const isMaxTier = tier >= MAX_TIER;
  const upCost = isMaxTier ? Infinity : weaponUpgradeCost(tier);
  const art = getWeaponArt(weapon.id);
  const targetShort =
    weapon.target === "highest_hp" ? "PRI"
    : weapon.target === "random"   ? "SPR"
    : "AOE";
  return (
    <ItemFrame owned={owned} tier={tier} itemName="Primary Weapon · Auto-Fire">
      {/* Cinematic art — same source the Codex uses, full image via
          object-contain with a soft handoff into the info panel below */}
      <div
        className="relative w-full overflow-hidden mb-2 mt-1"
        style={{ height: 150, background: "rgba(7,11,16,0.85)", border: "1px solid rgba(96,165,250,0.18)" }}
      >
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-helldiver-yellow/30 text-3xl">▶▶</div>
        )}
        {/* Soft dark gradient at bottom — visually connects to the panel below */}
        <div
          aria-hidden
          className="absolute left-0 right-0 bottom-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 100%)" }}
        />
      </div>

      {/* Name */}
      <div className="font-display font-black text-base tracking-tight text-white mb-2 leading-tight">
        {weapon.name}
      </div>

      {/* Combined stats + description panel — stats centered above
          description, no rule between (matches Codex card design). */}
      <div className="grid grid-cols-3 items-end mb-1.5">
        <CenteredStat label="DMG" value={`${eff.damage}`} accent="yellow" />
        <CenteredStat label="HITS" value={`${eff.hitsPerTurn}`} accent="white" />
        <CenteredStat
          label={eff.ignoreArmor ? "TGT · AP" : "TGT"}
          value={targetShort}
          accent={eff.ignoreArmor ? "yellow" : "white"}
        />
      </div>
      <div className="text-[10.5px] text-gray-300 leading-snug mb-3 italic text-center px-1">
        {weapon.description}
      </div>

      <ActionButtons
        owned={owned}
        isMaxTier={isMaxTier}
        canBuy={canBuy}
        canUpgrade={canUpgrade(tier)}
        buyCost={WEAPON_PURCHASE_COST}
        buyCurrency="medals"
        upgradeCost={upCost}
        upgradeCurrency="samples"
        onBuy={onBuy}
        onUpgrade={onUpgrade}
      />
    </ItemFrame>
  );
}

/** Big-numeric stat used inside the redesigned Outfitter weapon card. */
function CenteredStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "yellow" | "white";
}) {
  const color = accent === "yellow" ? "text-helldiver-yellow" : "text-white";
  return (
    <div className="flex flex-col items-center justify-end">
      <span className={clsx("font-display font-black tabular-nums leading-none", color)} style={{ fontSize: 18 }}>
        {value}
      </span>
      <span
        className="font-display font-black uppercase mt-0.5 truncate text-helldiver-dim"
        style={{ fontSize: 7, letterSpacing: "0.18em", maxWidth: "100%" }}
      >
        {label}
      </span>
    </div>
  );
}

function BoosterCard({
  booster,
  owned,
  tier,
  canBuy,
  canUpgrade,
  onBuy,
  onUpgrade,
}: {
  booster: Booster;
  owned: boolean;
  tier: number;
  canBuy: boolean;
  canUpgrade: (tier: number) => boolean;
  onBuy: () => void;
  onUpgrade: () => void;
}) {
  const isMaxTier = tier >= MAX_TIER;
  const upCost = isMaxTier ? Infinity : boosterUpgradeCost(tier);
  // Booster effects are baked into the engine. Show a textual potency hint.
  const potencyDescription = (() => {
    if (booster.id === "hellpod_optimization") {
      const amt = Math.round(2 * (tier === 3 ? 2 : tier === 2 ? 1.5 : 1));
      return `+${amt} starting Requisition every combat.`;
    }
    if (booster.id === "vitality_enhancement") {
      const amt = Math.round(15 * (tier === 3 ? 2 : tier === 2 ? 1.5 : 1));
      return `+${amt} max HP for the entire run.`;
    }
    if (booster.id === "stamina_enhancement") {
      // Stamina is a +1 hand size — doesn't scale numerically. Description stays.
      return booster.description;
    }
    if (booster.id === "localization_confusion") {
      return `First ${tier} turn${tier === 1 ? "" : "s"} of every combat: enemies skip their actions.`;
    }
    return booster.description;
  })();
  const art = getBoosterArt(booster.id);
  return (
    <ItemFrame owned={owned} tier={tier} itemName="Booster · Drop-Pod Augment">
      {/* Cinematic booster art — object-contain so the full pod / canister
          render is visible. Tinted purple frame to match the booster
          category's visual identity throughout the rest of the codebase. */}
      <div
        className="relative w-full overflow-hidden mb-2 mt-1"
        style={{ height: 150, background: "rgba(7,11,16,0.85)", border: "1px solid rgba(168,85,247,0.18)" }}
      >
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-purple-400/40 text-3xl">◆</div>
        )}
        <div
          aria-hidden
          className="absolute left-0 right-0 bottom-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 100%)" }}
        />
      </div>

      <div className="font-display font-black text-base tracking-tight text-white mb-2 leading-tight">
        {booster.name}
      </div>
      <div className="text-[10px] text-gray-300 leading-snug mb-3 italic">
        {potencyDescription}
      </div>
      <ActionButtons
        owned={owned}
        isMaxTier={isMaxTier}
        canBuy={canBuy}
        canUpgrade={canUpgrade(tier)}
        buyCost={BOOSTER_PURCHASE_COST}
        buyCurrency="requisition"
        upgradeCost={upCost}
        upgradeCurrency="samples"
        onBuy={onBuy}
        onUpgrade={onUpgrade}
      />
    </ItemFrame>
  );
}

function ActionButtons({
  owned,
  isMaxTier,
  canBuy,
  canUpgrade,
  buyCost,
  buyCurrency,
  upgradeCost,
  upgradeCurrency,
  onBuy,
  onUpgrade,
}: {
  owned: boolean;
  isMaxTier: boolean;
  canBuy: boolean;
  canUpgrade: boolean;
  buyCost: number;
  buyCurrency: "medals" | "samples" | "requisition";
  upgradeCost: number;
  upgradeCurrency: "medals" | "samples" | "requisition";
  onBuy: () => void;
  onUpgrade: () => void;
}) {
  const currencyColor: Record<string, string> = {
    medals: "text-helldiver-yellow border-helldiver-yellow",
    samples: "text-sky-400 border-sky-400",
    requisition: "text-helldiver-orange border-helldiver-orange",
  };
  const currencyGlyph: Record<string, string> = {
    medals: "M",
    samples: "S",
    requisition: "R",
  };

  if (!owned) {
    return (
      <button
        onClick={onBuy}
        disabled={!canBuy}
        className={clsx(
          "w-full py-2 px-3 border-2 font-display font-black uppercase tracking-widest text-xs transition-colors",
          canBuy
            ? clsx(currencyColor[buyCurrency], "hover:bg-current/10")
            : "border-helldiver-red/60 text-helldiver-red/80 cursor-not-allowed opacity-60"
        )}
      >
        Purchase · {buyCost} {currencyGlyph[buyCurrency]}
      </button>
    );
  }
  if (isMaxTier) {
    return (
      <div className="w-full py-2 px-3 border-2 border-purple-400 text-purple-300 font-display font-black uppercase tracking-widest text-xs text-center">
        ★ Maxed · MK III
      </div>
    );
  }
  return (
    <button
      onClick={onUpgrade}
      disabled={!canUpgrade}
      className={clsx(
        "w-full py-2 px-3 border-2 font-display font-black uppercase tracking-widest text-xs transition-colors",
        canUpgrade
          ? clsx(currencyColor[upgradeCurrency], "hover:bg-current/10")
          : "border-helldiver-red/60 text-helldiver-red/80 cursor-not-allowed opacity-60"
      )}
    >
      Upgrade · {upgradeCost} {currencyGlyph[upgradeCurrency]}
    </button>
  );
}
