"use client";

/**
 * SHIP · S.E.S. Democratic Flame
 * ──────────────────────────────────────────────────────────────────────
 * View Ship destination — destroyer status, ship modules, crew roster.
 * The ship is the player's home base; this is where they admire it.
 */

import { useGame } from "@/lib/store";
import { SHIP_MODULES } from "@/lib/account";
import HubFrame, { HubButton, HubCard, HUB_TOKENS as C } from "./hub/HubFrame";

export default function ShipScreen() {
  const { account, goToArmory } = useGame();
  const installed = SHIP_MODULES.filter((m) => account.unlockedModules.includes(m.id));
  const available = SHIP_MODULES.filter((m) => !account.unlockedModules.includes(m.id));

  return (
    <HubFrame
      title="S.E.S. Democratic Flame"
      subtitle="Destroyer · CV-77 · Active"
      badge={
        <div
          className="px-3 py-1.5 border flex items-center gap-2"
          style={{ borderColor: C.yellow, background: `${C.yellow}10`, borderRadius: 1 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: C.yellow }}>
            100% READINESS
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 max-w-[1400px] mx-auto">
        {/* Hero ship card */}
        <HubCard title="Bridge Status" accent={C.yellow}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat label="Hull Integrity"   value="100%"          accent={C.green} />
            <Stat label="Power Output"     value="NOMINAL"       accent={C.green} />
            <Stat label="Stratagem Bays"   value={String(installed.length + 5)} accent={C.cyan} />
            <Stat label="Hellpods Ready"   value="ALL CLEAR"     accent={C.yellow} />
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: C.textMid }}>
            All decks reporting nominal. The Democratic Flame is ready for deployment
            on your command. Stratagems primed. Hellpods loaded. Eagle wing on standby.
          </p>
        </HubCard>

        {/* Active orders */}
        <HubCard title="Crew Roster" accent={C.cyan}>
          <CrewRow role="Captain"        callsign={account.helldiverName ?? "HELLDIVER"} accent={C.yellow} />
          <CrewRow role="Eagle Wing"     callsign="Eagle-1"        accent={C.cyan} />
          <CrewRow role="Tac. Officer"   callsign="Patriot-77"     accent={C.cyan} />
          <CrewRow role="Engineer"       callsign="Liberty-23"     accent={C.cyan} />
          <CrewRow role="Democracy Off." callsign="Sgt. Yelena"    accent={C.orange} />
        </HubCard>

        {/* Installed modules */}
        <HubCard
          title={`Installed Modules · ${installed.length}/${SHIP_MODULES.length}`}
          accent={C.cyan}
          className="lg:col-span-2"
        >
          {installed.length === 0 ? (
            <div className="text-[10px] uppercase tracking-[0.3em] py-3" style={{ color: C.textDim }}>
              No modules installed. Visit the Armory to acquire your first ship module.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {installed.map((m) => (
                <ModuleRow key={m.id} name={m.name} description={m.description} active />
              ))}
            </div>
          )}

          {available.length > 0 && (
            <>
              <div className="mt-4 mb-2 text-[8px] uppercase tracking-[0.35em]" style={{ color: C.textDim }}>
                AVAILABLE FOR PURCHASE
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {available.slice(0, 6).map((m) => (
                  <ModuleRow key={m.id} name={m.name} description={m.description} cost={m.cost} />
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <HubButton onClick={goToArmory}>Open Armory ▶</HubButton>
              </div>
            </>
          )}
        </HubCard>
      </div>
    </HubFrame>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="px-3 py-2 border"
      style={{ borderColor: C.rule, background: "rgba(255,255,255,0.02)", borderRadius: 1 }}
    >
      <div className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>{label}</div>
      <div className="text-sm font-display font-black tabular-nums mt-1" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function CrewRow({ role, callsign, accent }: { role: string; callsign: string; accent: string }) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderBottom: `1px solid ${C.rule}` }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: accent, fontSize: 11 }}>◆</span>
        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: C.textMid }}>{role}</span>
      </div>
      <span className="text-[11px] font-display font-black tracking-wider" style={{ color: accent }}>
        {callsign}
      </span>
    </div>
  );
}

function ModuleRow({ name, description, cost, active }: { name: string; description: string; cost?: number; active?: boolean }) {
  const accent = active ? C.green : C.cyan;
  return (
    <div
      className="px-3 py-2 border flex items-start gap-3"
      style={{ borderColor: active ? `${accent}55` : C.rule, background: active ? `${accent}10` : "transparent", borderRadius: 1 }}
    >
      <span style={{ color: accent, fontSize: 13, lineHeight: 1 }}>{active ? "▣" : "◇"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wider font-display font-black truncate" style={{ color: accent }}>
            {name}
          </span>
          {cost !== undefined && (
            <span className="text-[9px] uppercase tracking-widest font-black tabular-nums shrink-0" style={{ color: C.cyan }}>
              ◆ {cost}
            </span>
          )}
        </div>
        <p className="text-[9px] leading-snug mt-1" style={{ color: C.textDim }}>{description}</p>
      </div>
    </div>
  );
}
