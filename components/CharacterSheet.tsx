"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  ARMORS,
  WEAPONS,
  BOOSTERS,
  DEFAULT_ARMOR,
  DEFAULT_WEAPON,
  DEFAULT_BOOSTER,
  MAX_TIER,
  getArmorEffective,
  getWeaponEffective,
  getBoosterPotency,
} from "@/lib/loadout";
import { getHelldiverRank, xpToLevelUp, SHIP_MODULES } from "@/lib/account";
import { CAPES, getCape, getTitle } from "@/lib/cosmetics";
import StarField from "./StarField";
import HudFrame from "./HudFrame";

const TIER_LABEL: Record<number, string> = { 1: "MK I", 2: "MK II", 3: "MK III" };
const TIER_COLOR: Record<number, string> = {
  1: "text-helldiver-yellow border-helldiver-yellow",
  2: "text-sky-300 border-sky-400",
  3: "text-purple-300 border-purple-400",
};
const WEIGHT_LABEL: Record<string, string> = {
  scout: "LIGHT",
  frontline: "MEDIUM",
  fortified: "HEAVY",
};

const STARTING_HP = 100;
const MAX_REQUISITION = 4;
const BASE_HAND_SIZE = 5;

export default function CharacterSheet() {
  const { account, goToMenu, goToArmory } = useGame();

  // Players have multiple owned items per slot — let them try-on different gear
  // here without committing to a run. This is a preview-only paper-doll.
  const [armorId, setArmorId] = useState(
    account.ownedArmors.includes(DEFAULT_ARMOR) ? DEFAULT_ARMOR : (account.ownedArmors[0] ?? DEFAULT_ARMOR)
  );
  const [weaponId, setWeaponId] = useState(
    account.ownedWeapons.includes(DEFAULT_WEAPON) ? DEFAULT_WEAPON : (account.ownedWeapons[0] ?? DEFAULT_WEAPON)
  );
  const [boosterId, setBoosterId] = useState(
    account.ownedBoosters.includes(DEFAULT_BOOSTER) ? DEFAULT_BOOSTER : (account.ownedBoosters[0] ?? DEFAULT_BOOSTER)
  );

  const armorTier = account.armorTiers[armorId] ?? 1;
  const weaponTier = account.weaponTiers[weaponId] ?? 1;
  const boosterTier = account.boosterTiers[boosterId] ?? 1;
  const armor = getArmorEffective(armorId, armorTier);
  const weapon = getWeaponEffective(weaponId, weaponTier);
  const booster = BOOSTERS.find((b) => b.id === boosterId) ?? BOOSTERS[0];
  const boosterPotency = getBoosterPotency(boosterTier);

  // ── Derived total stats (matching engine's freshPlayer + computeHandSize) ──
  let derivedHp = STARTING_HP + armor.hpMod;
  if (boosterId === "vitality_enhancement") {
    derivedHp += Math.round(15 * boosterPotency);
  }
  if (account.unlockedModules.includes("vitamin_d3")) derivedHp += 20;

  let derivedMaxR = MAX_REQUISITION + armor.reqMod;
  if (account.unlockedModules.includes("hellpod_storage")) derivedMaxR += 1;

  let derivedHand = BASE_HAND_SIZE + armor.handMod;
  if (boosterId === "stamina_enhancement") derivedHand += 1;
  if (account.unlockedModules.includes("streamlined_launch")) derivedHand += 1;
  derivedHand = Math.max(3, derivedHand);

  let derivedStartingBlock = armor.startingBlock;
  if (boosterId === "muscle_enhancement") derivedStartingBlock += Math.round(2 * boosterPotency);

  let derivedReinf = 3 + (armor.reinforcementBonus ?? 0);
  if (boosterId === "increased_reinforcement") derivedReinf += 1;

  const cape = getCape(account.equippedCape);
  const title = getTitle(account.equippedTitle);
  const rank = getHelldiverRank(account.level);
  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1">
              ◢ Helldiver Service Record · Personal Sheet ◣
            </div>
            <div className="text-3xl font-display font-black tracking-tight">
              CHARACTER SHEET
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                sfx.click();
                goToArmory();
              }}
              className="px-4 py-2 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black font-display font-bold uppercase tracking-widest text-xs transition-colors"
            >
              ⌥ Outfitter
            </button>
            <button
              onClick={() => {
                sfx.click();
                goToMenu();
              }}
              className="px-4 py-2 border-2 border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow font-display font-bold uppercase tracking-widest text-xs transition-colors"
            >
              ◀ Bridge
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_280px] gap-4">
          {/* LEFT — Identity + Rank */}
          <div className="space-y-4">
            <HudFrame label="Helldiver Identity" accent="yellow" glow className="p-4">
              <div className={clsx("h-1.5 mb-3 -mx-4 -mt-4 bg-gradient-to-r", cape.colorClass)} />
              <div className="text-center mb-3">
                {title.id && (
                  <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-orange font-bold mb-1">
                    {title.name}
                  </div>
                )}
                <div className="font-display font-black text-2xl text-helldiver-yellow tracking-wider mb-1">
                  {account.helldiverName ?? "ANONYMOUS"}
                </div>
                <div className="text-[10px] text-helldiver-dim uppercase tracking-widest">
                  SES Democratic Flame
                </div>
              </div>

              <div className="border-t border-helldiver-steel pt-3 mb-3">
                <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-1">Rank</div>
                <div className="font-display font-black text-xl text-emerald-400 tracking-tight">
                  {rank.title}
                </div>
                <div className="text-[10px] text-helldiver-dim mt-0.5">
                  {rank.abbr} · Level {account.level}
                </div>
              </div>

              <div className="text-[10px] mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-helldiver-dim uppercase tracking-widest">XP</span>
                  <span className="text-helldiver-yellow tabular-nums">
                    {account.xp} / {xpNext}
                  </span>
                </div>
                <div className="h-1.5 bg-black border border-helldiver-steel overflow-hidden">
                  <motion.div
                    animate={{ width: `${xpPct}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 25 }}
                    className="h-full bg-gradient-to-r from-helldiver-yellow to-yellow-400"
                  />
                </div>
                {rank.nextAt && (
                  <div className="text-[9px] text-helldiver-dim mt-1 uppercase tracking-widest">
                    Next rank at level {rank.nextAt}
                  </div>
                )}
              </div>
            </HudFrame>

            <HudFrame label="Service Wallet" accent="steel" className="p-4">
              <div className="space-y-2 text-sm">
                <WalletRow label="Medals" amount={account.medals} color="text-helldiver-yellow" />
                <WalletRow label="Samples" amount={account.samples} color="text-sky-400" />
                <WalletRow label="Requisition" amount={account.requisition} color="text-helldiver-orange" />
              </div>
            </HudFrame>

            <HudFrame label="Service Record" accent="steel" className="p-4">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <RecordCell label="Total Runs" value={account.totalRuns} />
                <RecordCell label="Victories" value={account.victories} />
                <RecordCell label="Stratagems" value={account.unlockedCards.length} />
                <RecordCell label="Modules" value={`${account.unlockedModules.length} / ${SHIP_MODULES.length}`} />
              </div>
            </HudFrame>
          </div>

          {/* CENTER — Paper-Doll Equipment Slots */}
          <div className="space-y-4">
            <HudFrame label="Combat Loadout · Paper Doll" accent="yellow" className="p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim mb-3 text-center">
                ◢ Equipped Configuration ◣
              </div>

              <SlotPicker
                kind="armor"
                title="Body Armor"
                accentColor="border-helldiver-yellow text-helldiver-yellow"
                items={ARMORS.filter((a) => account.ownedArmors.includes(a.id))}
                currentId={armorId}
                tier={armorTier}
                weightLabel={WEIGHT_LABEL[armor.weightClass]}
                passiveName={armor.passiveName}
                description={armor.passive}
                onPick={(id) => { sfx.cardSelect(); setArmorId(id); }}
                getTier={(id) => account.armorTiers[id] ?? 1}
              />

              <SlotPicker
                kind="weapon"
                title="Primary Weapon"
                accentColor="border-sky-400 text-sky-300"
                items={WEAPONS.filter((w) => account.ownedWeapons.includes(w.id))}
                currentId={weaponId}
                tier={weaponTier}
                description={weapon.description}
                onPick={(id) => { sfx.cardSelect(); setWeaponId(id); }}
                getTier={(id) => account.weaponTiers[id] ?? 1}
              />

              <SlotPicker
                kind="booster"
                title="Booster"
                accentColor="border-purple-400 text-purple-300"
                items={BOOSTERS.filter((b) => account.ownedBoosters.includes(b.id))}
                currentId={boosterId}
                tier={boosterTier}
                description={booster.description}
                onPick={(id) => { sfx.cardSelect(); setBoosterId(id); }}
                getTier={(id) => account.boosterTiers[id] ?? 1}
              />
            </HudFrame>
          </div>

          {/* RIGHT — Derived Stats */}
          <div className="space-y-4">
            <HudFrame label="Derived Combat Stats" accent="emerald" glow className="p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 mb-3">
                ◢ With Current Loadout ◣
              </div>
              <div className="space-y-3">
                <BigStat
                  label="Max HP"
                  value={`${derivedHp}`}
                  delta={armor.hpMod !== 0 ? `${armor.hpMod >= 0 ? "+" : ""}${armor.hpMod}` : undefined}
                  color="text-emerald-400"
                />
                <BigStat
                  label="Weapon Damage"
                  value={`${weapon.damage}`}
                  detail={weapon.hitsPerTurn > 1 ? `× ${weapon.hitsPerTurn} hits` : undefined}
                  color="text-helldiver-orange"
                />
                <BigStat
                  label="Max Requisition"
                  value={`${derivedMaxR}`}
                  delta={armor.reqMod !== 0 ? `${armor.reqMod >= 0 ? "+" : ""}${armor.reqMod}` : undefined}
                  color="text-helldiver-yellow"
                />
                <BigStat
                  label="Hand Size"
                  value={`${derivedHand}`}
                  delta={armor.handMod !== 0 ? `${armor.handMod >= 0 ? "+" : ""}${armor.handMod}` : undefined}
                  color="text-sky-400"
                />
                <BigStat
                  label="Starting Block"
                  value={`+${derivedStartingBlock}`}
                  color="text-sky-300"
                />
                <BigStat
                  label="Reinforcements"
                  value={`${derivedReinf}`}
                  detail="@ Medium difficulty"
                  color="text-helldiver-yellow"
                />
              </div>
            </HudFrame>

            <HudFrame label="Active Passives" accent="steel" className="p-4">
              <div className="space-y-2 text-[11px]">
                {armor.passiveName && (
                  <Passive
                    name={armor.passiveName}
                    source={armor.name}
                    description={armor.passive}
                    color="text-helldiver-yellow"
                  />
                )}
                <Passive
                  name={booster.name}
                  source="Booster"
                  description={booster.description}
                  color="text-purple-300"
                />
                {weapon.ignoreArmor && (
                  <Passive
                    name="Armor Penetration"
                    source={weapon.name}
                    description="This weapon ignores enemy armor."
                    color="text-sky-300"
                  />
                )}
              </div>
            </HudFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletRow({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-widest text-helldiver-dim">{label}</span>
      <span className={clsx("font-display font-black tabular-nums text-lg", color)}>{amount.toLocaleString()}</span>
    </div>
  );
}

function RecordCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-helldiver-steel/40 p-2 bg-helldiver-panel/30">
      <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">{label}</div>
      <div className="font-display font-black text-lg text-helldiver-yellow tabular-nums">{value}</div>
    </div>
  );
}

function BigStat({
  label,
  value,
  delta,
  detail,
  color,
}: {
  label: string;
  value: string;
  delta?: string;
  detail?: string;
  color: string;
}) {
  return (
    <div className="border-l-2 border-helldiver-steel pl-3 py-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] uppercase tracking-widest text-helldiver-dim">{label}</span>
        {delta && (
          <span className={clsx("text-[10px] tabular-nums", delta.startsWith("-") ? "text-helldiver-red" : "text-emerald-400")}>
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={clsx("font-display font-black text-2xl tabular-nums", color)}>{value}</span>
        {detail && <span className="text-[10px] text-helldiver-dim uppercase tracking-widest">{detail}</span>}
      </div>
    </div>
  );
}

function Passive({
  name,
  source,
  description,
  color,
}: {
  name: string;
  source: string;
  description: string;
  color: string;
}) {
  return (
    <div className="border-l-2 border-current pl-2 py-1 text-helldiver-dim" style={{ borderColor: undefined }}>
      <div className={clsx("font-display font-bold text-[11px] tracking-wider", color)}>
        {name.toUpperCase()}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mb-0.5">{source}</div>
      <div className="text-[10px] text-gray-300 leading-snug">{description}</div>
    </div>
  );
}

function SlotPicker({
  title,
  accentColor,
  items,
  currentId,
  tier,
  weightLabel,
  passiveName,
  description,
  onPick,
  getTier,
}: {
  kind: "armor" | "weapon" | "booster";
  title: string;
  accentColor: string;
  items: { id: string; name: string }[];
  currentId: string;
  tier: number;
  weightLabel?: string;
  passiveName?: string;
  description: string;
  onPick: (id: string) => void;
  getTier: (id: string) => number;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">{title}</div>
        <div className="flex items-center gap-2">
          {weightLabel && (
            <span className="text-[8px] uppercase tracking-widest text-helldiver-dim border border-helldiver-steel/40 px-1.5 py-0.5">
              {weightLabel}
            </span>
          )}
          {passiveName && (
            <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">
              {passiveName}
            </span>
          )}
          <span className={clsx("px-1.5 py-0.5 border text-[9px] font-display font-black tracking-widest bg-black/60", TIER_COLOR[tier])}>
            {TIER_LABEL[tier]}
          </span>
        </div>
      </div>
      <div className={clsx("border-2 p-3 bg-helldiver-panel/40", accentColor.split(" ")[0])}>
        <div className="font-display font-black text-base text-white tracking-tight mb-1">
          {items.find((i) => i.id === currentId)?.name ?? "—"}
        </div>
        <div className="text-[10px] text-gray-300 leading-snug mb-2 italic">{description}</div>
        {items.length > 1 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-helldiver-steel/40">
            {items.map((it) => {
              const t = getTier(it.id);
              const sel = it.id === currentId;
              return (
                <button
                  key={it.id}
                  onClick={() => onPick(it.id)}
                  className={clsx(
                    "px-2 py-1 border text-[9px] uppercase tracking-widest font-mono transition-colors flex items-center gap-1",
                    sel
                      ? clsx(accentColor, "bg-current/10")
                      : "border-helldiver-steel/40 text-helldiver-dim hover:text-white"
                  )}
                >
                  <span>{it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name}</span>
                  <span className={clsx("text-[8px]", sel ? "" : "text-helldiver-dim")}>{TIER_LABEL[t]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
