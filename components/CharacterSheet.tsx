"use client";

/**
 * HELLDIVER OPERATIVE PROFILE
 * ──────────────────────────────────────────────────────────────────────
 * Cinematic operator command terminal — 3-column tactical layout.
 *   LEFT   — Operative identity (portrait, name, rank, XP) + service data
 *   CENTER — Paper-doll operator visual + equipped loadout cards
 *   RIGHT  — Derived combat telemetry + active passives
 *
 * This is intentionally a heavier UI than the old Character Sheet — it's
 * the screen the player parks on between drops. Visual style mirrors the
 * existing Hub: dark background, gold primary, cyan/green telemetry,
 * purple booster rarity, thin borders, scanline accents.
 */

import { useMemo, useState } from "react";
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
  getArmorEffective,
  getWeaponEffective,
  getBoosterPotency,
} from "@/lib/loadout";
import { getHelldiverRank, xpToLevelUp, SHIP_MODULES } from "@/lib/account";
import { getCape, getTitle } from "@/lib/cosmetics";
import { HELLDIVER_PORTRAIT } from "@/lib/artManifest";
import HubFrame from "./hub/HubFrame";

// ── Tokens (kept in sync with HubFrame) ─────────────────────────────────
const C = {
  bg0: "#0a0d12",
  panel: "#0e1218",
  panelDeep: "#0b0e14",
  hairline: "rgba(245,197,66,0.18)",
  rule: "rgba(255,255,255,0.06)",
  yellow: "#f5c542",
  orange: "#ff8a28",
  cyan: "#60c4ff",
  green: "#10b981",
  red: "#ff4d4d",
  purple: "#b18bff",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.65)",
  textDim: "rgba(255,255,255,0.4)",
} as const;

const TIER_LABEL: Record<number, string> = { 1: "MK I", 2: "MK II", 3: "MK III" };
const WEIGHT_LABEL: Record<string, string> = {
  scout: "LIGHT",
  frontline: "MEDIUM",
  fortified: "HEAVY",
};

const STARTING_HP = 100;
const MAX_REQUISITION = 4;
const BASE_HAND_SIZE = 5;

// ──────────────────────────────────────────────────────────────────────
//  Main screen
// ──────────────────────────────────────────────────────────────────────
export default function CharacterSheet() {
  const { account, goToArmory } = useGame();

  // Try-on state — preview gear without committing
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

  // ── Derived totals (mirrors engine's freshPlayer + computeHandSize) ──
  const derived = useMemo(() => {
    let hp = STARTING_HP + armor.hpMod;
    if (boosterId === "vitality_enhancement") hp += Math.round(15 * boosterPotency);
    if (account.unlockedModules.includes("vitamin_d3")) hp += 20;

    let maxR = MAX_REQUISITION + armor.reqMod;
    if (account.unlockedModules.includes("hellpod_storage")) maxR += 1;

    let hand = BASE_HAND_SIZE + armor.handMod;
    if (boosterId === "stamina_enhancement") hand += 1;
    if (account.unlockedModules.includes("streamlined_launch")) hand += 1;
    hand = Math.max(3, hand);

    let block = armor.startingBlock;
    if (boosterId === "muscle_enhancement") block += Math.round(2 * boosterPotency);

    let reinf = 3 + (armor.reinforcementBonus ?? 0);
    if (boosterId === "increased_reinforcement") reinf += 1;

    return { hp, maxR, hand, block, reinf };
  }, [armor, weapon, booster, armorTier, weaponTier, boosterTier, boosterId, account.unlockedModules, boosterPotency]);

  const cape = getCape(account.equippedCape);
  const title = getTitle(account.equippedTitle);
  const rank = getHelldiverRank(account.level);
  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);

  return (
    <HubFrame
      title="Helldiver Operative Profile"
      subtitle={`Super Destroyer · SES Democratic Flame${title.id ? ` · ${title.name}` : ""}`}
      badge={
        <button
          type="button"
          onClick={() => { sfx.click(); goToArmory(); }}
          onMouseEnter={() => sfx.hover()}
          className="px-4 py-2 transition-all flex items-center gap-2 font-display font-black uppercase"
          style={{
            background: `linear-gradient(135deg, ${C.yellow}, ${C.orange})`,
            color: C.bg0,
            border: `1px solid ${C.yellow}`,
            boxShadow: `0 0 14px ${C.yellow}66`,
            fontSize: 11,
            letterSpacing: "0.3em",
            borderRadius: 1,
          }}
        >
          <span style={{ fontSize: 13 }}>☰</span>
          <span>Outfitter</span>
        </button>
      }
    >
      <div className="max-w-[1480px] mx-auto">
        <div className="grid gap-4" style={{ gridTemplateColumns: "320px minmax(0,1fr) 320px" }}>
          {/* ═══════════════ LEFT — IDENTITY / SERVICE ═══════════════ */}
          <div className="space-y-4">
            <Panel label="Helldiver Identity" accent={C.yellow}>
              <Portrait
                cape={cape}
                rank={rank}
              />
              <div className="px-4 pt-4 pb-3 text-center border-b" style={{ borderColor: C.rule }}>
                {title.id && (
                  <div className="text-[9px] uppercase tracking-[0.35em] mb-1" style={{ color: C.orange }}>
                    {title.name}
                  </div>
                )}
                <div className="font-display font-black tracking-[0.18em] mb-1" style={{ color: C.yellow, fontSize: 22, textShadow: `0 0 8px ${C.yellow}55` }}>
                  {(account.helldiverName ?? "ANONYMOUS").toUpperCase()}
                </div>
                <div className="text-[9px] uppercase tracking-[0.35em]" style={{ color: C.textDim }}>
                  SES Democratic Flame
                </div>
              </div>

              {/* Rank + XP */}
              <div className="px-4 py-4">
                <div className="text-[9px] uppercase tracking-[0.35em] mb-2" style={{ color: C.textDim }}>Rank</div>
                <div className="flex items-baseline gap-3 mb-3">
                  <RankChevron level={account.level} />
                  <div className="leading-none">
                    <div className="font-display font-black tracking-tight" style={{ color: C.green, fontSize: 22 }}>
                      {rank.title.toUpperCase()}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest mt-1" style={{ color: C.textDim }}>
                      {rank.abbr} · Level {account.level}
                    </div>
                  </div>
                </div>

                {/* XP bar */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>XP</span>
                  <span className="text-[10px] tabular-nums font-display font-black" style={{ color: C.yellow }}>
                    {account.xp.toLocaleString()} / {xpNext.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden" style={{ background: C.bg0, border: `1px solid ${C.rule}` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 26 }}
                    className="h-full"
                    style={{
                      background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
                      boxShadow: `0 0 8px ${C.yellow}88`,
                    }}
                  />
                  <Scanline />
                </div>
                {rank.nextAt && (
                  <div className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: C.textDim }}>
                    Next rank at level {rank.nextAt}
                  </div>
                )}
              </div>
            </Panel>

            <Panel label="Service Wallet" accent={C.textDim}>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: C.rule }}>
                <WalletCell glyph="★" label="Medals" value={account.medals} accent={C.yellow} />
                <WalletCell glyph="◆" label="Samples" value={account.samples + account.rareSamples + account.superSamples} accent={C.cyan} />
                <WalletCell glyph="Ⓡ" label="Requisition" value={account.requisition} accent={C.orange} />
              </div>
            </Panel>

            <Panel label="Service Record" accent={C.textDim}>
              <div className="grid grid-cols-2 gap-px" style={{ background: C.rule }}>
                <RecordCell label="Total Runs" value={account.totalRuns} icon="🌐" />
                <RecordCell label="Victories" value={account.victories} icon="⚑" />
                <RecordCell label="Stratagems Unlocked" value={account.unlockedCards.length} icon="◎" />
                <RecordCell label="Modules Installed" value={`${account.unlockedModules.length} / ${SHIP_MODULES.length}`} icon="▦" />
              </div>
            </Panel>
          </div>

          {/* ═══════════════ CENTER — LOADOUT ═══════════════ */}
          <div className="space-y-4">
            <Panel label="Combat Loadout" accent={C.yellow}>
              <PaperDoll
                armor={armor}
                weaponName={weapon.name}
                boosterName={booster.name}
                weightLabel={WEIGHT_LABEL[armor.weightClass]}
              />
            </Panel>

            <Panel label="Equipped Loadout" accent={C.yellow}>
              <div className="p-4 space-y-3">
                <LoadoutCard
                  slot="Body Armor"
                  name={armor.name}
                  description={armor.passive}
                  tier={armorTier}
                  tags={[WEIGHT_LABEL[armor.weightClass], armor.passiveName ?? "TACTICAL"]}
                  accent={C.yellow}
                  options={ARMORS.filter((a) => account.ownedArmors.includes(a.id))}
                  currentId={armorId}
                  onPick={(id) => { sfx.cardSelect(); setArmorId(id); }}
                  getTier={(id) => account.armorTiers[id] ?? 1}
                />
                <LoadoutCard
                  slot="Primary Weapon"
                  name={weapon.name}
                  description={weapon.description}
                  tier={weaponTier}
                  tags={[`${weapon.damage} DMG`, weapon.hitsPerTurn > 1 ? `× ${weapon.hitsPerTurn}` : "SINGLE"]}
                  accent={C.cyan}
                  options={WEAPONS.filter((w) => account.ownedWeapons.includes(w.id))}
                  currentId={weaponId}
                  onPick={(id) => { sfx.cardSelect(); setWeaponId(id); }}
                  getTier={(id) => account.weaponTiers[id] ?? 1}
                />
                <LoadoutCard
                  slot="Booster"
                  name={booster.name}
                  description={booster.description}
                  tier={boosterTier}
                  tags={["RARE"]}
                  accent={C.purple}
                  rare
                  options={BOOSTERS.filter((b) => account.ownedBoosters.includes(b.id))}
                  currentId={boosterId}
                  onPick={(id) => { sfx.cardSelect(); setBoosterId(id); }}
                  getTier={(id) => account.boosterTiers[id] ?? 1}
                />
              </div>
            </Panel>
          </div>

          {/* ═══════════════ RIGHT — COMBAT TELEMETRY ═══════════════ */}
          <div className="space-y-4">
            <Panel label="Derived Combat Stats" accent={C.green}>
              <div className="px-4 pt-3 pb-2 text-[9px] uppercase tracking-[0.4em] flex items-center gap-2" style={{ color: C.green }}>
                <span>◀</span>
                <span>With Current Loadout</span>
                <span>▶</span>
              </div>
              <div className="px-4 pb-4 space-y-2">
                <BigStat icon="♥" label="Max HP" value={derived.hp} accent={C.green} delta={armor.hpMod} />
                <BigStat icon="◇" label="Weapon Damage" value={weapon.damage} accent={C.green} detail={weapon.hitsPerTurn > 1 ? `×${weapon.hitsPerTurn}` : undefined} />
                <BigStat icon="Ⓡ" label="Max Requisition" value={derived.maxR} accent={C.green} delta={armor.reqMod} />
                <BigStat icon="▤" label="Hand Size" value={derived.hand} accent={C.green} delta={armor.handMod} />
                <BigStat icon="⛨" label="Starting Block" value={`+${derived.block}`} accent={C.green} />

                <ReinforcementsRow count={derived.reinf} />
              </div>
            </Panel>

            <Panel label="Active Passives" accent={C.textDim}>
              <div className="p-3 space-y-2">
                {armor.passiveName && (
                  <PassiveChip
                    name={armor.passiveName}
                    source={armor.name}
                    description={armor.passive}
                    accent={C.yellow}
                    glyph="◆"
                  />
                )}
                <PassiveChip
                  name={booster.name}
                  source="Booster"
                  description={booster.description}
                  accent={C.purple}
                  rare
                  glyph="✦"
                />
                {weapon.ignoreArmor && (
                  <PassiveChip
                    name="Armor Penetration"
                    source={weapon.name}
                    description="This weapon ignores enemy armor."
                    accent={C.cyan}
                    glyph="◎"
                  />
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </HubFrame>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Atoms
// ──────────────────────────────────────────────────────────────────────

function Panel({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative"
      style={{
        background: `linear-gradient(180deg, ${C.panel}f0 0%, ${C.panelDeep}f5 100%)`,
        border: `1px solid ${C.rule}`,
        borderRadius: 1,
      }}
    >
      {/* top accent line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      {/* corner brackets */}
      <CornerBracket pos="tl" color={accent} />
      <CornerBracket pos="tr" color={accent} />
      <CornerBracket pos="bl" color={accent} />
      <CornerBracket pos="br" color={accent} />
      {/* label */}
      <div
        className="px-4 pt-3 pb-2 text-[9px] uppercase font-display font-black tracking-[0.35em] flex items-center gap-2"
        style={{ color: accent, textShadow: `0 0 6px ${accent}55` }}
      >
        <span style={{ opacity: 0.7 }}>//</span>
        <span>{label}</span>
      </div>
      {children}
    </section>
  );
}

function CornerBracket({ pos, color }: { pos: "tl" | "tr" | "bl" | "br"; color: string }) {
  const positions: Record<string, React.CSSProperties> = {
    tl: { top: -1, left: -1, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    tr: { top: -1, right: -1, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
    bl: { bottom: -1, left: -1, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    br: { bottom: -1, right: -1, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
  };
  return <span aria-hidden className="absolute w-2.5 h-2.5 pointer-events-none" style={positions[pos]} />;
}

function Scanline() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.10] mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 4px)",
      }}
    />
  );
}

// ── Identity portrait ──────────────────────────────────────────────────
function Portrait({
  cape,
  rank,
}: {
  cape: { colorClass: string };
  rank: { title: string };
}) {
  return (
    <div className="relative px-4 pt-4">
      <div
        className="relative aspect-square overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${C.yellow}22, ${C.bg0} 70%)`,
          border: `1px solid ${C.rule}`,
        }}
      >
        {/* Cape stripe accent at the very top */}
        <div className={clsx("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", cape.colorClass)} />

        {/* Helldiver portrait silhouette */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HELLDIVER_PORTRAIT}
          alt="Helldiver"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
          loading="lazy"
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <Scanline />

        {/* Division skull badge top-left */}
        <div
          className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center"
          style={{ background: `${C.bg0}cc`, border: `1px solid ${C.yellow}`, color: C.yellow }}
        >
          <span style={{ fontSize: 14, lineHeight: 1, textShadow: `0 0 6px ${C.yellow}88` }}>☠</span>
        </div>

        {/* Service tag bottom strip */}
        <div
          className="absolute inset-x-0 bottom-0 px-2 py-1 flex items-center justify-between"
          style={{ background: `linear-gradient(0deg, ${C.bg0}f5, transparent)` }}
        >
          <span className="text-[8px] uppercase tracking-[0.3em] font-mono" style={{ color: C.textDim }}>
            S/N · 5021-DF
          </span>
          <span className="text-[8px] uppercase tracking-[0.3em] font-mono" style={{ color: C.yellow }}>
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}

function RankChevron({ level }: { level: number }) {
  return (
    <div
      className="flex items-center justify-center font-display font-black"
      style={{
        width: 36,
        height: 36,
        background: `${C.green}18`,
        border: `1px solid ${C.green}`,
        color: C.green,
        textShadow: `0 0 6px ${C.green}88`,
        fontSize: 14,
      }}
    >
      L{level}
    </div>
  );
}

// ── Wallet + Service record cells ──────────────────────────────────────
function WalletCell({ glyph, label, value, accent }: { glyph: string; label: string; value: number; accent: string }) {
  return (
    <div className="px-3 py-3 flex items-center gap-2.5">
      <span
        className="font-display font-black"
        style={{ color: accent, fontSize: 16, lineHeight: 1, textShadow: `0 0 6px ${accent}66` }}
      >
        {glyph}
      </span>
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[8px] uppercase tracking-[0.25em] truncate" style={{ color: C.textDim }}>
          {label}
        </span>
        <span className="font-display font-black tabular-nums mt-1" style={{ color: accent, fontSize: 16 }}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function RecordCell({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div
      className="px-3 py-3"
      style={{ background: C.panelDeep }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: C.yellow, fontSize: 12, textShadow: `0 0 4px ${C.yellow}66` }}>{icon}</span>
        <span className="text-[8px] uppercase tracking-[0.25em] truncate" style={{ color: C.textDim }}>
          {label}
        </span>
      </div>
      <div className="font-display font-black tabular-nums" style={{ color: C.yellow, fontSize: 22, textShadow: `0 0 6px ${C.yellow}55` }}>
        {value}
      </div>
    </div>
  );
}

// ── Paper-doll operator visual ─────────────────────────────────────────
function PaperDoll({
  armor,
  weaponName,
  boosterName,
  weightLabel,
}: {
  armor: { name: string; weightClass: string };
  weaponName: string;
  boosterName: string;
  weightLabel: string;
}) {
  return (
    <div className="px-4 pt-3 pb-4">
      <div className="text-[9px] uppercase tracking-[0.4em] text-center mb-3" style={{ color: C.textDim }}>
        Operator Visual
      </div>

      <div
        className="relative mx-auto"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${C.yellow}11 0%, transparent 60%), linear-gradient(180deg, ${C.panelDeep} 0%, ${C.bg0} 100%)`,
          border: `1px solid ${C.rule}`,
          minHeight: 360,
        }}
      >
        {/* Tactical grid background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              `linear-gradient(${C.yellow}55 1px, transparent 1px), linear-gradient(90deg, ${C.yellow}55 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Portrait centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HELLDIVER_PORTRAIT}
            alt="Operator"
            className="h-[88%] w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
            draggable={false}
            loading="lazy"
          />
        </div>

        {/* Floor disc */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-3 w-40 h-3 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${C.yellow}33 0%, transparent 70%)`,
          }}
        />

        {/* Slot indicator: BODY ARMOR (top-left) */}
        <SlotChip pos={{ top: 12, left: 12 }} label="Body Armor" name={armor.name} accent={C.yellow} subtitle={weightLabel} />

        {/* Slot indicator: BOOSTER (top-right) */}
        <SlotChip pos={{ top: 12, right: 12 }} label="Booster" name={boosterName} accent={C.purple} subtitle="RARE" />

        {/* Slot indicator: PRIMARY WEAPON (bottom-left) */}
        <SlotChip pos={{ bottom: 12, left: 12 }} label="Primary Weapon" name={weaponName} accent={C.cyan} />

        {/* Slot grid: STRATAGEMS (bottom-right) */}
        <div
          className="absolute"
          style={{ bottom: 12, right: 12 }}
        >
          <div className="text-[8px] uppercase tracking-[0.3em] mb-1.5 text-right" style={{ color: C.textDim }}>
            Stratagems
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-9 h-9 flex items-center justify-center transition-colors"
                style={{
                  background: `${C.bg0}cc`,
                  border: `1px solid ${C.rule}`,
                  color: C.textDim,
                }}
              >
                <span style={{ fontSize: 12, opacity: 0.5 }}>◎</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reticle in center back */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 pointer-events-none opacity-[0.08]"
          style={{
            border: `1px dashed ${C.yellow}`,
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}

function SlotChip({
  pos,
  label,
  name,
  accent,
  subtitle,
}: {
  pos: React.CSSProperties;
  label: string;
  name: string;
  accent: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      className="absolute"
      style={pos}
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
    >
      <div
        className="px-2.5 py-2 max-w-[140px]"
        style={{
          background: `${C.bg0}f0`,
          border: `1px solid ${accent}`,
          boxShadow: `0 0 12px ${accent}33`,
          borderRadius: 1,
        }}
      >
        <div className="text-[8px] uppercase tracking-[0.3em]" style={{ color: accent, textShadow: `0 0 4px ${accent}88` }}>
          {label}
        </div>
        <div className="font-display font-black text-[11px] leading-tight mt-0.5" style={{ color: C.text }}>
          {name}
        </div>
        {subtitle && (
          <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: C.textDim }}>
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Loadout cards (stacked under paper-doll) ──────────────────────────
function LoadoutCard({
  slot,
  name,
  description,
  tier,
  tags,
  accent,
  rare,
  options,
  currentId,
  onPick,
  getTier,
}: {
  slot: string;
  name: string;
  description: string;
  tier: number;
  tags: string[];
  accent: string;
  rare?: boolean;
  options: { id: string; name: string }[];
  currentId: string;
  onPick: (id: string) => void;
  getTier: (id: string) => number;
}) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="relative"
      style={{
        background: `linear-gradient(135deg, ${accent}10, ${C.panelDeep} 60%)`,
        border: `${rare ? 2 : 1}px solid ${accent}`,
        boxShadow: rare ? `0 0 16px ${accent}44` : `0 0 6px ${accent}22`,
        borderRadius: 1,
      }}
    >
      <div className="p-3 flex items-stretch gap-3">
        {/* Slot thumbnail */}
        <div
          className="shrink-0 w-14 h-14 flex items-center justify-center"
          style={{
            background: `${C.bg0}cc`,
            border: `1px solid ${accent}`,
            color: accent,
            textShadow: `0 0 6px ${accent}88`,
          }}
        >
          <span style={{ fontSize: 22 }}>{slotGlyph(slot)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="font-display font-black text-[13px] tracking-wide truncate" style={{ color: C.text }}>
              {name.toUpperCase()}
            </div>
            <span
              className="shrink-0 text-[8px] uppercase tracking-widest font-display font-black px-1.5 py-0.5"
              style={{ border: `1px solid ${accent}`, color: accent }}
            >
              {TIER_LABEL[tier]}
            </span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.25em] mb-1.5" style={{ color: accent }}>
            {slot}
          </div>
          <div className="text-[10px] leading-snug mb-2" style={{ color: C.textMid }}>
            {description}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-display font-black"
                  style={{
                    background: `${accent}18`,
                    border: `1px solid ${accent}55`,
                    color: accent,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {options.length > 1 && (
        <div className="px-3 pb-3 -mt-1">
          <div className="flex flex-wrap gap-1 pt-2 border-t" style={{ borderColor: C.rule }}>
            {options.map((opt) => {
              const sel = opt.id === currentId;
              const t = getTier(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPick(opt.id)}
                  onMouseEnter={() => sfx.hover()}
                  className="px-2 py-1 text-[8px] uppercase tracking-widest font-mono transition-all flex items-center gap-1"
                  style={{
                    background: sel ? `${accent}22` : "transparent",
                    border: `1px solid ${sel ? accent : C.rule}`,
                    color: sel ? accent : C.textMid,
                  }}
                >
                  <span>{opt.name.length > 18 ? opt.name.slice(0, 16) + "…" : opt.name}</span>
                  <span style={{ opacity: 0.7 }}>{TIER_LABEL[t]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function slotGlyph(slot: string): string {
  if (slot.toLowerCase().includes("armor")) return "▦";
  if (slot.toLowerCase().includes("weapon")) return "⌬";
  if (slot.toLowerCase().includes("booster")) return "✦";
  return "◎";
}

// ── Right-column stat blocks ───────────────────────────────────────────
function BigStat({
  icon,
  label,
  value,
  accent,
  delta,
  detail,
}: {
  icon: string;
  label: string;
  value: number | string;
  accent: string;
  delta?: number;
  detail?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={{
        background: `${C.bg0}80`,
        border: `1px solid ${C.rule}`,
        borderLeft: `2px solid ${accent}`,
      }}
    >
      <span
        className="font-display font-black"
        style={{ color: accent, fontSize: 18, textShadow: `0 0 6px ${accent}66`, width: 22, textAlign: "center" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            {label}
          </span>
          {delta !== undefined && delta !== 0 && (
            <span
              className="text-[9px] tabular-nums font-display font-black"
              style={{ color: delta > 0 ? C.green : C.red }}
            >
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-black tabular-nums" style={{ color: accent, fontSize: 22, textShadow: `0 0 6px ${accent}55` }}>
            {value}
          </span>
          {detail && (
            <span className="text-[9px] uppercase tracking-widest" style={{ color: C.textDim }}>
              {detail}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ReinforcementsRow({ count }: { count: number }) {
  // Show 4 helmet slots (max realistic), filled per `count`
  const slots = 4;
  return (
    <div
      className="px-3 py-2 mt-1"
      style={{
        background: `${C.bg0}80`,
        border: `1px solid ${C.rule}`,
        borderLeft: `2px solid ${C.yellow}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span style={{ color: C.yellow, fontSize: 16, textShadow: `0 0 6px ${C.yellow}66` }}>☠</span>
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            Reinforcements
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-widest" style={{ color: C.textDim }}>
          @ Medium
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: slots }).map((_, i) => {
          const live = i < count;
          return (
            <span
              key={i}
              className="font-display font-black flex items-center justify-center w-7 h-7"
              style={{
                background: live ? `${C.yellow}18` : `${C.red}10`,
                border: `1px solid ${live ? C.yellow : C.red}55`,
                color: live ? C.yellow : C.red,
                textShadow: live ? `0 0 4px ${C.yellow}88` : undefined,
                fontSize: 14,
                opacity: live ? 1 : 0.45,
              }}
            >
              ☠
            </span>
          );
        })}
        <span className="ml-2 text-[10px] tabular-nums font-display font-black" style={{ color: C.yellow }}>
          {count}
        </span>
      </div>
    </div>
  );
}

function PassiveChip({
  name,
  source,
  description,
  accent,
  rare,
  glyph,
}: {
  name: string;
  source: string;
  description: string;
  accent: string;
  rare?: boolean;
  glyph: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="relative px-3 py-2"
      style={{
        background: `linear-gradient(90deg, ${accent}18, transparent 70%)`,
        border: `1px solid ${accent}55`,
        borderLeft: `2px solid ${accent}`,
        boxShadow: rare ? `0 0 10px ${accent}33` : undefined,
        borderRadius: 1,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: accent, fontSize: 12, textShadow: `0 0 4px ${accent}88` }}>{glyph}</span>
        <span className="text-[10px] uppercase tracking-[0.3em] font-display font-black" style={{ color: accent }}>
          {name.toUpperCase()}
        </span>
      </div>
      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textDim }}>
        {source}
      </div>
      <div className="text-[10px] leading-snug" style={{ color: C.textMid }}>
        {description}
      </div>
    </motion.div>
  );
}
