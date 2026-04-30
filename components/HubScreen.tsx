"use client";

/**
 * HUB · Destroyer Bridge
 * ──────────────────────────────────────────────────────────────────────────
 * AAA-style command center: top status bar, left vertical nav, center
 * Helldiver + loadout stage, right context-sensitive details, bottom CTA bar.
 *
 * Inspired by Destiny 2 character screen + Helldivers 2 ship UI.
 *
 * Layout grid (desktop):
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │  TOP BAR (callsign · rank · currencies · live ticker)              │
 *   ├──────┬──────────────────────────────────────────┬──────────────────┤
 *   │      │                                          │                  │
 *   │ NAV  │   HELLDIVER + LOADOUT (the showpiece)    │  DETAILS PANEL   │
 *   │      │                                          │                  │
 *   ├──────┴──────────────────────────────────────────┴──────────────────┤
 *   │  BOTTOM BAR  ·  DEPLOY · EDIT LOADOUT · CHANGE PLANET              │
 *   └────────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx, isMuted, setMuted } from "@/lib/sfx";
import { initAudioMixer } from "@/lib/audioMixer";
import AudioSettingsPanel from "./AudioSettingsPanel";
import {
  ARMORS,
  WEAPONS,
  BOOSTERS,
  DEFAULT_ARMOR,
  DEFAULT_WEAPON,
  DEFAULT_BOOSTER,
  getArmorEffective,
  getWeaponEffective,
} from "@/lib/loadout";
import { CARD_LIBRARY, getCardById } from "@/lib/cards";
import { getHelldiverRank, xpToLevelUp } from "@/lib/account";
import { getCape, getTitle } from "@/lib/cosmetics";
import { generateActivity, listPlanets, loadWarState, WarState } from "@/lib/galacticWar";
import { HELLDIVER_PORTRAIT } from "@/lib/artManifest";
import { Card } from "@/lib/types";
import StarField from "./StarField";
import { FactionIcon, StratagemIcon } from "@/lib/icons";

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
export default function HubScreen() {
  const {
    account,
    settings,
    setSetting,
    setHelldiverName,
    resetAccount,
    goToWar,
    goToCharacter,
    goToArmory,
    goToCodex,
    goToSquadHub,
  } = useGame();

  // Detail-panel mode — what gets shown on the right.
  const [detail, setDetail] = useState<DetailMode>({ kind: "service_record" });

  // Equipment preview: latest used or first owned.
  const [armorId, setArmorId] = useState(
    account.ownedArmors.includes(DEFAULT_ARMOR) ? DEFAULT_ARMOR : (account.ownedArmors[0] ?? DEFAULT_ARMOR)
  );
  const [weaponId, setWeaponId] = useState(
    account.ownedWeapons.includes(DEFAULT_WEAPON) ? DEFAULT_WEAPON : (account.ownedWeapons[0] ?? DEFAULT_WEAPON)
  );
  const [boosterId, setBoosterId] = useState(
    account.ownedBoosters.includes(DEFAULT_BOOSTER) ? DEFAULT_BOOSTER : (account.ownedBoosters[0] ?? DEFAULT_BOOSTER)
  );

  // Live ticker — rolling propaganda lines from local war state.
  const [ticker, setTicker] = useState<string[]>([]);
  useEffect(() => {
    const planets = listPlanets(loadWarState());
    setTicker(Array.from({ length: 8 }).map(() => generateActivity(planets)));
    const t = setInterval(() => {
      setTicker((prev) => [generateActivity(planets), ...prev].slice(0, 12));
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen text-white font-mono relative overflow-hidden">
      {/* Layered background */}
      <HubBackground />

      <div
        className="relative z-10 min-h-screen flex flex-col"
        style={{ background: "transparent" }}
      >
        {/* ── TOP BAR ── */}
        <HubTopBar
          ticker={ticker}
          account={account}
          settings={settings}
          setSetting={setSetting}
          setHelldiverName={setHelldiverName}
        />

        {/* ── MAIN GRID — nav | center | details ── */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[180px_1fr_320px] gap-0 relative">
          {/* LEFT NAV */}
          <HubLeftNav
            onWar={() => { sfx.click(); goToWar(); }}
            onCharacter={() => { sfx.click(); goToCharacter(); }}
            onArmory={() => { sfx.click(); goToArmory(); }}
            onCodex={() => { sfx.click(); goToCodex(); }}
            onSquad={() => { sfx.click(); goToSquadHub(); }}
            onHistory={() => { sfx.click(); setDetail({ kind: "history" }); }}
          />

          {/* CENTER STAGE */}
          <HubCenter
            armorId={armorId}
            weaponId={weaponId}
            boosterId={boosterId}
            onSelectArmor={() => setDetail({ kind: "armor", id: armorId })}
            onSelectWeapon={() => setDetail({ kind: "weapon", id: weaponId })}
            onSelectBooster={() => setDetail({ kind: "booster", id: boosterId })}
            onSelectStratagem={(id) => setDetail({ kind: "stratagem", id })}
            onCycleArmor={() => {
              const owned = account.ownedArmors;
              const i = owned.indexOf(armorId);
              const next = owned[(i + 1) % owned.length] ?? armorId;
              setArmorId(next);
              setDetail({ kind: "armor", id: next });
              sfx.cardSelect();
            }}
            onCycleWeapon={() => {
              const owned = account.ownedWeapons;
              const i = owned.indexOf(weaponId);
              const next = owned[(i + 1) % owned.length] ?? weaponId;
              setWeaponId(next);
              setDetail({ kind: "weapon", id: next });
              sfx.cardSelect();
            }}
            onCycleBooster={() => {
              const owned = account.ownedBoosters;
              const i = owned.indexOf(boosterId);
              const next = owned[(i + 1) % owned.length] ?? boosterId;
              setBoosterId(next);
              setDetail({ kind: "booster", id: next });
              sfx.cardSelect();
            }}
            armorTier={account.armorTiers[armorId] ?? 1}
            weaponTier={account.weaponTiers[weaponId] ?? 1}
            boosterTier={account.boosterTiers[boosterId] ?? 1}
            account={account}
          />

          {/* RIGHT DETAILS */}
          <HubDetailsPanel
            mode={detail}
            account={account}
            onResetToServiceRecord={() => setDetail({ kind: "service_record" })}
            onResetAccount={resetAccount}
          />
        </div>

        {/* ── BOTTOM BAR ── */}
        <HubBottomBar
          onDeploy={() => { sfx.unlock(); sfx.beacon(); goToWar(); }}
          onEditLoadout={() => { sfx.click(); goToCharacter(); }}
          onChangePlanet={() => { sfx.click(); goToWar(); }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  BACKGROUND
// ──────────────────────────────────────────────────────────────────────
function HubBackground() {
  return (
    <>
      {/* Base color */}
      <div className="absolute inset-0" style={{ background: "#0b0f14" }} />

      {/* Star field */}
      <div className="absolute inset-0 opacity-70">
        <StarField />
      </div>

      {/* Orbital gradient — deep blue radial wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(77,166,255,0.08), transparent 60%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(245,197,66,0.05), transparent 70%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Scanlines — very subtle */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  TOP BAR
// ──────────────────────────────────────────────────────────────────────
function HubTopBar({
  ticker,
  account,
  settings,
  setSetting,
  setHelldiverName,
}: {
  ticker: string[];
  account: any;
  settings: any;
  setSetting: any;
  setHelldiverName: (n: string) => void;
}) {
  const rank = getHelldiverRank(account.level);
  const cape = getCape(account.equippedCape);
  const title = getTitle(account.equippedTitle);
  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);

  const [muted, setMutedState] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(account.helldiverName ?? "");
  const [audioPanelOpen, setAudioPanelOpen] = useState(false);

  useEffect(() => {
    initAudioMixer();
    setMuted(settings.muted);
    setMutedState(settings.muted);
  }, [settings.muted]);

  return (
    <header
      className="relative border-b border-white/10 backdrop-blur-md"
      style={{ background: "rgba(17, 24, 33, 0.85)" }}
    >
      {/* Cape stripe accent */}
      <div className={clsx("absolute inset-x-0 top-0 h-px bg-gradient-to-r", cape.colorClass)} />

      <div className="px-4 md:px-6 py-2 flex items-center gap-4 flex-wrap min-h-[64px]">
        {/* Logo + Identity */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="font-display font-black text-lg tracking-[0.2em]" style={{ color: "#f5c542" }}>
            HELLDIVERS
            <span className="text-white/30 mx-1">·</span>
            <span className="text-white/60 text-xs tracking-[0.3em]">STRATAGEM PROTOCOL</span>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/10" />

          <div className="hidden sm:block">
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {rank.title}
            </div>
            <div className="flex items-center gap-2">
              {editingName ? (
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  maxLength={24}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sfx.click();
                      setHelldiverName(draftName);
                      setEditingName(false);
                    } else if (e.key === "Escape") {
                      setEditingName(false);
                    }
                  }}
                  onBlur={() => {
                    setHelldiverName(draftName);
                    setEditingName(false);
                  }}
                  className="bg-black/60 border-2 px-2 py-0.5 font-display font-black text-base focus:outline-none w-40"
                  style={{ borderColor: "#f5c542", color: "#f5c542" }}
                />
              ) : (
                <button
                  onClick={() => {
                    sfx.click();
                    setDraftName(account.helldiverName ?? "");
                    setEditingName(true);
                  }}
                  className="font-display font-black text-base tracking-wider hover:text-white transition-colors text-left"
                  style={{ color: "#f5c542" }}
                  title="Rename Helldiver"
                >
                  {account.helldiverName ?? "ANONYMOUS"}
                </button>
              )}
              {title.id && (
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#ff8a28" }}>
                  {title.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live ticker — slides left */}
        <div className="flex-1 hidden lg:block min-w-0 mx-2">
          <div
            className="border border-white/10 bg-black/40 overflow-hidden h-7 flex items-center gap-2"
            style={{ paddingInline: "8px" }}
          >
            <span
              className="shrink-0 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.3em] font-display font-black flex items-center gap-1"
              style={{ background: "#f5c542", color: "#0b0f14" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              GALACTIC FEED
            </span>
            <div className="flex-1 overflow-hidden relative">
              <motion.div
                key={ticker[0]}
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[11px] text-white/70 truncate font-mono"
              >
                ▸ {ticker[0] ?? "Awaiting field reports..."}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Currencies */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <Currency label="Medals" value={account.medals} color="#f5c542" />
          <span className="w-px h-6 bg-white/10" />
          <SampleStack
            common={account.samples}
            rare={account.rareSamples}
            sup={account.superSamples}
          />
          <span className="w-px h-6 bg-white/10" />
          <Currency label="Req" value={account.requisition} color="#ff8a28" />
        </div>

        {/* Settings cluster */}
        <div className="flex items-center gap-1">
          <SettingChip
            active={!muted}
            label={muted ? "🔇" : "🔊"}
            onClick={() => {
              sfx.unlock();
              sfx.click();
              const next = !muted;
              setMuted(next);
              setMutedState(next);
              setSetting("muted", next);
            }}
          />
          <SettingChip
            active={settings.codeMinigameEnabled}
            label="⌨"
            onClick={() => {
              sfx.unlock();
              sfx.click();
              setSetting("codeMinigameEnabled", !settings.codeMinigameEnabled);
            }}
            title="Stratagem code minigame"
          />
          <SettingChip
            active={audioPanelOpen}
            label="🎚"
            onClick={() => {
              sfx.unlock();
              sfx.click();
              setAudioPanelOpen((v) => !v);
            }}
            title="Audio mixer · master + per-layer volumes"
          />
        </div>
      </div>

      <AudioSettingsPanel
        open={audioPanelOpen}
        onClose={() => setAudioPanelOpen(false)}
      />

      {/* Sub-row · XP bar */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-3">
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 shrink-0">
          {rank.abbr} · LV {account.level}
        </span>
        <div className="flex-1 h-1 bg-white/5 border border-white/10 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(to right, #f5c542, #ff8a28)" }}
            animate={{ width: `${xpPct}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
          />
        </div>
        <span className="text-[9px] uppercase tracking-widest text-white/40 tabular-nums">
          {account.xp} / {xpNext} XP
        </span>
      </div>
    </header>
  );
}

function Currency({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 hidden sm:inline">
        {label}
      </span>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="font-display font-black tabular-nums text-base"
        style={{ color }}
      >
        {value.toLocaleString()}
      </motion.span>
    </div>
  );
}

function SampleStack({ common, rare, sup }: { common: number; rare: number; sup: number }) {
  return (
    <div className="flex items-baseline gap-1" title="Common · Rare · Super Samples">
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 hidden sm:inline mr-0.5">
        Samples
      </span>
      <motion.span key={`c-${common}`} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-display font-black tabular-nums" style={{ color: "#4da6ff" }}>{common}</motion.span>
      <span className="text-white/20 text-[9px]">·</span>
      <motion.span key={`r-${rare}`} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-display font-black tabular-nums text-emerald-400">{rare}</motion.span>
      <span className="text-white/20 text-[9px]">·</span>
      <motion.span key={`s-${sup}`} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-display font-black tabular-nums" style={{ color: "#ff8a28" }}>{sup}</motion.span>
    </div>
  );
}

function SettingChip({
  active,
  label,
  onClick,
  title,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        "w-8 h-8 flex items-center justify-center border text-xs transition-colors",
        active
          ? "border-helldiver-yellow text-helldiver-yellow"
          : "border-white/10 text-white/40 hover:border-helldiver-yellow hover:text-helldiver-yellow"
      )}
    >
      {label}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  LEFT NAV
// ──────────────────────────────────────────────────────────────────────
function HubLeftNav({
  onWar,
  onCharacter,
  onArmory,
  onCodex,
  onSquad,
  onHistory,
}: {
  onWar: () => void;
  onCharacter: () => void;
  onArmory: () => void;
  onCodex: () => void;
  onSquad: () => void;
  onHistory: () => void;
}) {
  const items = [
    { id: "war", label: "War Map", icon: "✦", onClick: onWar, hint: "Sector deployment" },
    { id: "char", label: "Loadout", icon: "◈", onClick: onCharacter, hint: "Equipment + paper-doll" },
    { id: "armory", label: "Armory", icon: "⌥", onClick: onArmory, hint: "Outfitter · Warbonds · Modules" },
    { id: "codex", label: "Stratagems", icon: "◊", onClick: onCodex, hint: "Browse all materiel" },
    { id: "squad", label: "Squad", icon: "◇", onClick: onSquad, hint: "Form or join" },
    { id: "history", label: "History", icon: "◐", onClick: onHistory, hint: "Mission record" },
  ];

  return (
    <nav className="hidden md:flex flex-col py-4 gap-1 border-r border-white/10" style={{ background: "rgba(17, 24, 33, 0.6)" }}>
      {items.map((it, i) => (
        <motion.button
          key={it.id}
          onClick={it.onClick}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          whileHover={{ x: 3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={clsx(
            "mx-2 px-3 py-3 border text-left flex items-center gap-3 transition-colors group",
            "border-transparent hover:border-helldiver-yellow/60 hover:bg-helldiver-yellow/5"
          )}
          title={it.hint}
        >
          <span
            className="text-xl text-white/60 group-hover:text-helldiver-yellow transition-colors w-6 text-center"
          >
            {it.icon}
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white group-hover:text-helldiver-yellow font-display font-bold">
              {it.label}
            </div>
            <div className="text-[8px] uppercase tracking-widest text-white/30">{it.hint}</div>
          </div>
        </motion.button>
      ))}
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  CENTER STAGE — Helldiver portrait + equipment + stratagems
// ──────────────────────────────────────────────────────────────────────
function HubCenter({
  armorId,
  weaponId,
  boosterId,
  armorTier,
  weaponTier,
  boosterTier,
  account,
  onSelectArmor,
  onSelectWeapon,
  onSelectBooster,
  onSelectStratagem,
  onCycleArmor,
  onCycleWeapon,
  onCycleBooster,
}: {
  armorId: string;
  weaponId: string;
  boosterId: string;
  armorTier: number;
  weaponTier: number;
  boosterTier: number;
  account: any;
  onSelectArmor: () => void;
  onSelectWeapon: () => void;
  onSelectBooster: () => void;
  onSelectStratagem: (cardId: string) => void;
  onCycleArmor: () => void;
  onCycleWeapon: () => void;
  onCycleBooster: () => void;
}) {
  const armor = ARMORS.find((a) => a.id === armorId);
  const weapon = WEAPONS.find((w) => w.id === weaponId);
  const booster = BOOSTERS.find((b) => b.id === boosterId);

  // Show last-used loadout's stratagems if available, otherwise empty slots.
  const equippedStratagemIds = (account.lastLoadout?.stratagemIds as string[] | undefined) ?? [];
  const stratagems: (Card | null)[] = Array.from({ length: 5 }).map((_, i) => {
    const id = equippedStratagemIds[i];
    if (!id) return null;
    try { return getCardById(id); } catch { return null; }
  });

  return (
    <main className="relative px-4 md:px-8 py-6 flex flex-col gap-6 overflow-y-auto">
      {/* Header band */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/40">
            ◢ Destroyer Bridge · Pre-Drop Configuration ◣
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight mt-1">
            HELLDIVER LOADOUT
          </h1>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40">SES</div>
          <div className="text-sm font-display font-black" style={{ color: "#f5c542" }}>
            DEMOCRATIC FLAME
          </div>
        </div>
      </div>

      {/* Hero portrait + equipment strip */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
        <HelldiverPortrait />

        <div className="flex flex-col gap-3">
          <SectionLabel>Equipped</SectionLabel>
          <EquipmentSlot
            label="Body Armor"
            name={armor?.name ?? "—"}
            subtitle={armor?.passiveName ?? "Passive"}
            description={armor?.passive ?? ""}
            tier={armorTier}
            accent="#f5c542"
            onClick={onSelectArmor}
            onCycle={onCycleArmor}
            ownedCount={account.ownedArmors.length}
          />
          <EquipmentSlot
            label="Primary Weapon"
            name={weapon?.name ?? "—"}
            subtitle={`${weapon?.damage ?? 0} dmg · ${weapon?.hitsPerTurn ?? 1} hits`}
            description={weapon?.description ?? ""}
            tier={weaponTier}
            accent="#4da6ff"
            onClick={onSelectWeapon}
            onCycle={onCycleWeapon}
            ownedCount={account.ownedWeapons.length}
          />
          <EquipmentSlot
            label="Booster"
            name={booster?.name ?? "—"}
            subtitle="Drop-Pod Augment"
            description={booster?.description ?? ""}
            tier={boosterTier}
            accent="#a78bfa"
            onClick={onSelectBooster}
            onCycle={onCycleBooster}
            ownedCount={account.ownedBoosters.length}
          />
        </div>
      </div>

      {/* Stratagem slots */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Stratagem Slots · 5</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stratagems.map((card, i) => (
            <StratagemSlot
              key={i}
              index={i}
              card={card}
              onClick={() => card && onSelectStratagem(card.id)}
            />
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          Stratagem slots are configured during pre-drop loadout. Press{" "}
          <span className="text-helldiver-yellow">DEPLOY</span> to begin.
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
      <span className="w-2 h-px bg-white/30" />
      {children}
      <span className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function HelldiverPortrait() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative aspect-[4/5] border border-white/10 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #111821 0%, #0b0f14 100%)" }}
    >
      {/* Frame brackets */}
      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 z-10" style={{ borderColor: "#f5c542" }} />
      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 z-10" style={{ borderColor: "#f5c542" }} />
      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 z-10" style={{ borderColor: "#f5c542" }} />
      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 z-10" style={{ borderColor: "#f5c542" }} />

      {/* Idle breathing portrait */}
      <motion.div
        animate={{ scale: [1, 1.02, 1], y: [0, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HELLDIVER_PORTRAIT}
          alt=""
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
      </motion.div>

      {/* Soft top/bottom gradient for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,15,20,0.4) 0%, transparent 25%, transparent 70%, rgba(11,15,20,0.85) 100%)",
        }}
      />

      {/* Bottom plate */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-10">
        <div className="text-[9px] uppercase tracking-[0.4em] text-white/50 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          STATUS · OPERATIONAL
        </div>
        <div className="font-display font-black text-xl tracking-tight mt-0.5" style={{ color: "#f5c542" }}>
          READY FOR DEPLOYMENT
        </div>
      </div>

      {/* Scanline sweep */}
      <motion.div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, rgba(245,197,66,0.4), transparent)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

function EquipmentSlot({
  label,
  name,
  subtitle,
  description,
  tier,
  accent,
  ownedCount,
  onClick,
  onCycle,
}: {
  label: string;
  name: string;
  subtitle: string;
  description: string;
  tier: number;
  accent: string;
  ownedCount: number;
  onClick: () => void;
  onCycle: () => void;
}) {
  const tierLabel = tier === 3 ? "MK III" : tier === 2 ? "MK II" : "MK I";
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="relative border border-white/10 hover:border-white/30 group transition-colors"
      style={{ background: "rgba(17, 24, 33, 0.7)" }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 inset-y-0 w-1" style={{ background: accent }} />

      <button onClick={onClick} className="w-full p-4 text-left flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 flex items-center gap-1.5">
            {label}
            <span className="px-1.5 py-px border text-[8px] tabular-nums" style={{ borderColor: accent, color: accent }}>
              {tierLabel}
            </span>
          </div>
          <div className="font-display font-black text-base tracking-tight text-white truncate">
            {name}
          </div>
          <div className="text-[10px] text-white/50 truncate" style={{ color: accent }}>
            {subtitle}
          </div>
          <div className="text-[10px] text-white/60 italic line-clamp-1 mt-0.5">
            {description}
          </div>
        </div>
        <div className="text-white/20 group-hover:text-white/60 transition-colors">→</div>
      </button>

      {/* Cycle button (if multiple owned) */}
      {ownedCount > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onCycle(); }}
          className="absolute top-2 right-2 px-2 py-0.5 text-[9px] uppercase tracking-widest border border-white/10 text-white/40 hover:border-helldiver-yellow hover:text-helldiver-yellow transition-colors"
          title={`Cycle (${ownedCount} owned)`}
        >
          CYCLE
        </button>
      )}
    </motion.div>
  );
}

function StratagemSlot({
  index,
  card,
  onClick,
}: {
  index: number;
  card: Card | null;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={card ? { scale: 1.04, y: -2 } : { scale: 1.01 }}
      whileTap={card ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={!card}
      className={clsx(
        "relative aspect-[3/4] border-2 flex flex-col items-stretch overflow-hidden transition-colors",
        card ? "border-helldiver-yellow/60 hover:border-helldiver-yellow" : "border-dashed border-white/10"
      )}
      style={{ background: card ? "rgba(17,24,33,0.85)" : "rgba(17,24,33,0.4)" }}
    >
      {card ? (
        <>
          <div className="px-2 py-1 border-b border-white/10 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-white/40">SLOT {index + 1}</span>
            <span className="text-[10px] font-display font-black" style={{ color: "#f5c542" }}>
              {card.cost}R
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center text-3xl" style={{ color: "#f5c542" }}>
            <StratagemIcon type={card.type} className="w-12 h-12" />
          </div>
          <div className="px-2 py-1 text-[10px] font-display font-bold text-white truncate text-center border-t border-white/10">
            {card.name}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-2xl">+</span>
          <span className="text-[9px] uppercase tracking-widest mt-1">Slot {index + 1}</span>
        </div>
      )}
    </motion.button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  RIGHT DETAILS PANEL
// ──────────────────────────────────────────────────────────────────────
type DetailMode =
  | { kind: "service_record" }
  | { kind: "armor"; id: string }
  | { kind: "weapon"; id: string }
  | { kind: "booster"; id: string }
  | { kind: "stratagem"; id: string }
  | { kind: "history" };

function HubDetailsPanel({
  mode,
  account,
  onResetToServiceRecord,
  onResetAccount,
}: {
  mode: DetailMode;
  account: any;
  onResetToServiceRecord: () => void;
  onResetAccount: () => void;
}) {
  return (
    <aside
      className="hidden md:flex flex-col py-4 px-3 gap-3 border-l border-white/10 overflow-y-auto"
      style={{ background: "rgba(17, 24, 33, 0.6)" }}
    >
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.4em] text-white/40">
        <span>{detailHeader(mode)}</span>
        {mode.kind !== "service_record" && (
          <button
            onClick={onResetToServiceRecord}
            className="text-white/40 hover:text-helldiver-yellow text-[9px] uppercase tracking-widest"
          >
            ← Service
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode.kind + ("id" in mode ? mode.id : "")}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.18 }}
          className="flex-1"
        >
          {mode.kind === "service_record" && <ServiceRecordPanel account={account} onResetAccount={onResetAccount} />}
          {mode.kind === "armor" && <ArmorDetail id={mode.id} tier={account.armorTiers[mode.id] ?? 1} />}
          {mode.kind === "weapon" && <WeaponDetail id={mode.id} tier={account.weaponTiers[mode.id] ?? 1} />}
          {mode.kind === "booster" && <BoosterDetail id={mode.id} />}
          {mode.kind === "stratagem" && <StratagemDetail id={mode.id} />}
          {mode.kind === "history" && <HistoryDetail account={account} />}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function detailHeader(mode: DetailMode): string {
  switch (mode.kind) {
    case "service_record": return "Service Record";
    case "armor": return "Armor · Detail";
    case "weapon": return "Weapon · Detail";
    case "booster": return "Booster · Detail";
    case "stratagem": return "Stratagem · Detail";
    case "history": return "Mission History";
  }
}

function ServiceRecordPanel({ account, onResetAccount }: { account: any; onResetAccount: () => void }) {
  const rank = getHelldiverRank(account.level);
  const winRate = account.totalRuns > 0
    ? Math.round((account.victories / account.totalRuns) * 100)
    : 0;

  // War record
  const [war, setWar] = useState<WarState | null>(null);
  useEffect(() => {
    setWar(loadWarState());
  }, []);
  const planets = war ? listPlanets(war) : [];
  const liberated = planets.filter((p) => p.liberation >= 100).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">Helldiver</div>
        <div className="text-2xl font-display font-black" style={{ color: "#f5c542" }}>
          {account.helldiverName ?? "ANONYMOUS"}
        </div>
        <div className="text-[10px] text-emerald-400 uppercase tracking-widest mt-0.5">
          {rank.title} · {rank.abbr}
        </div>
        {rank.nextAt && (
          <div className="text-[9px] text-white/30 mt-0.5">
            Next promotion at LV {rank.nextAt}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <Stat label="Total Runs" value={account.totalRuns} />
        <Stat label="Victories" value={account.victories} />
        <Stat label="Win Rate" value={`${winRate}%`} />
        <Stat label="Stratagems" value={account.unlockedCards.length} />
      </div>

      <div className="border-t border-white/10 pt-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">Galactic War</div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <Stat label="Liberated" value={`${liberated} / ${planets.length}`} />
          <Stat label="MO Claims" value={`${(war?.completedOrderIds?.length ?? 0)}`} />
        </div>
      </div>

      <div className="border-t border-white/10 pt-3">
        <button
          onClick={() => {
            if (confirm("Reset all account progress? This cannot be undone.")) {
              onResetAccount();
            }
          }}
          className="w-full text-[9px] uppercase tracking-[0.3em] text-helldiver-red/60 hover:text-helldiver-red font-mono transition-colors py-2 border border-white/10 hover:border-helldiver-red/40"
        >
          ⚠ Reset Account Progress
        </button>
      </div>
    </div>
  );
}

function ArmorDetail({ id, tier }: { id: string; tier: number }) {
  const armor = getArmorEffective(id, tier);
  const base = ARMORS.find((a) => a.id === id);
  if (!base) return null;
  const tierLabel = tier === 3 ? "MK III" : tier === 2 ? "MK II" : "MK I";
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
          {base.weightClass.toUpperCase()} ARMOR
          <span className="px-1.5 py-px text-[8px] border tabular-nums" style={{ borderColor: "#f5c542", color: "#f5c542" }}>
            {tierLabel}
          </span>
        </div>
        <div className="text-xl font-display font-black mt-1 leading-tight" style={{ color: "#f5c542" }}>
          {base.name}
        </div>
        <div className="text-[10px] text-emerald-400 uppercase tracking-widest mt-1">
          {base.passiveName ?? "Tactical"}
        </div>
      </div>
      <div className="text-[11px] text-white/70 italic leading-relaxed border-l-2 border-helldiver-yellow/40 pl-2">
        {base.passive}
      </div>
      <div className="space-y-1.5 border-t border-white/10 pt-3">
        <Row label="HP Mod" value={armor.hpMod >= 0 ? `+${armor.hpMod}` : `${armor.hpMod}`} />
        <Row label="Starting Block" value={`+${armor.startingBlock}`} />
        <Row label="Hand Mod" value={armor.handMod >= 0 ? `+${armor.handMod}` : `${armor.handMod}`} />
        <Row label="Req Mod" value={armor.reqMod >= 0 ? `+${armor.reqMod}` : `${armor.reqMod}`} />
        {base.bonusStims ? <Row label="Bonus Stims" value={`+${base.bonusStims}`} /> : null}
      </div>
    </div>
  );
}

function WeaponDetail({ id, tier }: { id: string; tier: number }) {
  const weapon = getWeaponEffective(id, tier);
  const tierLabel = tier === 3 ? "MK III" : tier === 2 ? "MK II" : "MK I";
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
          PRIMARY WEAPON
          <span className="px-1.5 py-px text-[8px] border tabular-nums" style={{ borderColor: "#4da6ff", color: "#4da6ff" }}>
            {tierLabel}
          </span>
        </div>
        <div className="text-xl font-display font-black mt-1 leading-tight" style={{ color: "#4da6ff" }}>
          {weapon.name}
        </div>
      </div>
      <div className="text-[11px] text-white/70 italic leading-relaxed border-l-2 border-sky-400/40 pl-2">
        {weapon.description}
      </div>
      <div className="space-y-1.5 border-t border-white/10 pt-3">
        <Row label="Damage" value={`${weapon.damage}`} accent />
        <Row label="Hits / Turn" value={`${weapon.hitsPerTurn}`} />
        <Row label="Targeting" value={weapon.target.replace("_", " ").toUpperCase()} />
        {weapon.ignoreArmor && <Row label="Special" value="IGNORES ARMOR" accent />}
      </div>
    </div>
  );
}

function BoosterDetail({ id }: { id: string }) {
  const booster = BOOSTERS.find((b) => b.id === id);
  if (!booster) return null;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">BOOSTER</div>
        <div className="text-xl font-display font-black mt-1 leading-tight" style={{ color: "#a78bfa" }}>
          {booster.name}
        </div>
      </div>
      <div className="text-[11px] text-white/70 italic leading-relaxed border-l-2 pl-2" style={{ borderColor: "#a78bfa66" }}>
        {booster.description}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-white/30">
        Boosters apply for the entire run.
      </div>
    </div>
  );
}

function StratagemDetail({ id }: { id: string }) {
  let card: Card | null = null;
  try { card = getCardById(id); } catch {}
  if (!card) return null;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          {card.type.toUpperCase()} · {card.rarity.toUpperCase()}
        </div>
        <div className="text-xl font-display font-black mt-1 leading-tight text-white">
          {card.name}
        </div>
      </div>
      <div className="text-[11px] text-white/70 italic leading-relaxed border-l-2 border-helldiver-yellow/40 pl-2">
        {card.description}
      </div>
      <div className="space-y-1.5 border-t border-white/10 pt-3">
        <Row label="Requisition Cost" value={`${card.cost} R`} accent />
        <Row label="Targeting" value={card.target.replace("_", " ").toUpperCase()} />
        {card.effect.damage !== undefined && <Row label="Damage" value={`${card.effect.damage}`} />}
        {card.effect.damageHits !== undefined && <Row label="Hits" value={`${card.effect.damageHits}`} />}
        {card.effect.burn !== undefined && <Row label="Burn" value={`${card.effect.burn}`} />}
        {card.effect.block !== undefined && <Row label="Block" value={`${card.effect.block}`} />}
        {card.effect.heal !== undefined && <Row label="Heal" value={`${card.effect.heal}`} />}
        {card.effect.draw !== undefined && <Row label="Draw" value={`${card.effect.draw}`} />}
        {card.effect.stripShield !== undefined && <Row label="Strip Shield" value={`${card.effect.stripShield}`} />}
        {card.effect.recurringDamage && (
          <Row label="Recurring" value={`${card.effect.recurringDamage.amount}/turn × ${card.effect.recurringDamage.turns}`} />
        )}
        {card.effect.exhaust && <Row label="Special" value="EXHAUST" />}
        {card.effect.ignoreArmor && <Row label="Special" value="IGNORES ARMOR" />}
      </div>
    </div>
  );
}

function HistoryDetail({ account }: { account: any }) {
  if (!account.history || account.history.length === 0) {
    return <div className="text-[11px] text-white/40 italic">No deployments on record.</div>;
  }
  return (
    <div className="space-y-1.5">
      {account.history.map((h: any, i: number) => (
        <div
          key={i}
          className={clsx(
            "border-l-2 pl-2 py-1",
            h.outcome === "victory" ? "border-emerald-400" : "border-helldiver-red"
          )}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className={h.outcome === "victory" ? "text-emerald-400" : "text-helldiver-red"}>
              {h.outcome === "victory" ? "✓ VICTORY" : "✕ DEFEAT"}
            </span>
            <span className="text-white/40 tabular-nums">+{h.medalsEarned}M</span>
          </div>
          <div className="text-[11px] text-white truncate font-display">{h.planet}</div>
          <div className="text-[9px] text-white/30 uppercase tracking-widest">
            {h.faction} · D{h.difficulty ?? "?"} · {h.nodesCleared} nodes
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-white/10 p-2 bg-black/20">
      <div className="text-[9px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="font-display font-black text-lg tabular-nums" style={{ color: "#f5c542" }}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/40 uppercase tracking-widest">{label}</span>
      <span
        className={clsx(
          "font-display font-bold tabular-nums",
          accent ? "" : "text-white"
        )}
        style={accent ? { color: "#f5c542" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  BOTTOM BAR — primary CTAs
// ──────────────────────────────────────────────────────────────────────
function HubBottomBar({
  onDeploy,
  onEditLoadout,
  onChangePlanet,
}: {
  onDeploy: () => void;
  onEditLoadout: () => void;
  onChangePlanet: () => void;
}) {
  return (
    <div
      className="border-t border-white/10 px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap"
      style={{ background: "rgba(17, 24, 33, 0.85)" }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDeploy}
        className="flex-1 min-w-[200px] py-3 px-6 font-display font-black uppercase tracking-[0.3em] text-base border-2 transition-all relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f5c542 0%, #ff8a28 100%)",
          color: "#0b0f14",
          borderColor: "#f5c542",
          boxShadow: "0 0 24px rgba(245,197,66,0.4)",
        }}
      >
        ▶ DEPLOY HELLDIVER
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onEditLoadout}
        className="py-3 px-5 font-display font-bold uppercase tracking-[0.25em] text-xs border-2 transition-colors"
        style={{
          borderColor: "rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.85)",
          background: "rgba(11,15,20,0.6)",
        }}
      >
        ⌥ EDIT LOADOUT
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onChangePlanet}
        className="py-3 px-5 font-display font-bold uppercase tracking-[0.25em] text-xs border-2 transition-colors"
        style={{
          borderColor: "rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.85)",
          background: "rgba(11,15,20,0.6)",
        }}
      >
        ✦ CHANGE PLANET
      </motion.button>
    </div>
  );
}
