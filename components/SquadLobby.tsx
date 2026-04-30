"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { rollModifiers, getModifier } from "@/lib/modifiers";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import SquadChatBox from "./SquadChatBox";
import { FactionIcon } from "@/lib/icons";

export default function SquadLobby() {
  const { account, squadCode, leaveSquad, difficulty, setDifficulty } = useGame();
  const squad = useQuery(api.squads.get, squadCode ? { code: squadCode } : "skip");
  const coopMission = useQuery(api.coop.get, squadCode ? { squadCode } : "skip");
  const war = useQuery(api.war.getWar);
  const setReady = useMutation(api.squads.setReady);
  const leaveMut = useMutation(api.squads.leave);
  const setMissionConfig = useMutation(api.squads.setMissionConfig);
  const deploy = useMutation(api.squads.deploy);
  const createCoop = useMutation(api.coop.createMission);
  const updatePresence = useMutation(api.squads.updatePresence);

  const [seed, setSeed] = useState(() => Date.now());

  const me = squad?.members.find((m) => m.name === account.helldiverName);
  const isHost = squad?.hostName === account.helldiverName;
  const allReady = squad ? squad.members.every((m) => m.ready) : false;
  const planets = war?.planets ?? [];
  const targetPlanet = planets.find((p) => p.slug === squad?.targetPlanetSlug);

  const modifierIds = useMemo(() => {
    if (!targetPlanet) return [];
    return rollModifiers(targetPlanet.faction, squad?.difficulty ?? difficulty, seed);
  }, [targetPlanet, squad?.difficulty, difficulty, seed]);

  // Heartbeat
  useEffect(() => {
    if (!squadCode || !account.helldiverName) return;
    const send = () => {
      updatePresence({
        code: squadCode,
        helldiverName: account.helldiverName!,
        phase: "lobby",
      }).catch(() => {});
    };
    send();
    const t = setInterval(send, 8000);
    return () => clearInterval(t);
  }, [squadCode, account.helldiverName, updatePresence]);

  // Auto-route to co-op combat when mission exists
  useEffect(() => {
    if (coopMission && squadCode) {
      useGame.setState({ phase: "coop_combat", targetPlanetId: coopMission.planetSlug });
    }
  }, [coopMission, squadCode]);

  if (!squadCode) {
    return (
      <div className="min-h-screen bg-helldiver-dark flex items-center justify-center text-helldiver-yellow">
        Disconnected. Returning to HQ...
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="min-h-screen text-white font-mono p-6 relative">
        <StarField />
        <div className="text-center py-20 text-helldiver-yellow">Connecting to squad {squadCode}...</div>
      </div>
    );
  }

  const handleReady = () => {
    if (!me) return;
    sfx.click();
    setReady({
      code: squadCode,
      helldiverName: account.helldiverName!,
      ready: !me.ready,
    });
  };

  const handleLeave = () => {
    sfx.click();
    leaveMut({ code: squadCode, helldiverName: account.helldiverName! });
    leaveSquad();
  };

  const handleSetPlanet = (slug: string) => {
    if (!isHost) return;
    sfx.click();
    setMissionConfig({
      code: squadCode,
      helldiverName: account.helldiverName!,
      planetSlug: slug,
      difficulty: squad.difficulty,
    });
  };

  const handleSetDifficulty = (d: number) => {
    if (!isHost) return;
    sfx.click();
    setDifficulty(d);
    if (squad.targetPlanetSlug) {
      setMissionConfig({
        code: squadCode,
        helldiverName: account.helldiverName!,
        planetSlug: squad.targetPlanetSlug,
        difficulty: d,
      });
    }
  };

  const handleDeploy = async () => {
    if (!isHost || !allReady || !squad.targetPlanetSlug || !targetPlanet) {
      sfx.alert();
      return;
    }
    sfx.beacon();
    const defaultDeck = [
      "orbital_precision",
      "orbital_precision",
      "orbital_precision",
      "util_stim",
      "util_shield",
      "eagle_airstrike",
      "support_recoilless",
      "sentry_mg",
      "util_resupply",
      "support_eat",
    ];
    const players = squad.members.map((m) => ({
      name: m.name,
      ownedDeckIds: defaultDeck,
      armorId: "frontline",
      weaponId: "ar23_liberator",
      boosterId: "hellpod_optimization",
    }));
    await createCoop({
      squadCode,
      faction: targetPlanet.faction,
      difficulty: squad.difficulty,
      modifiers: modifierIds,
      planetSlug: squad.targetPlanetSlug,
      helldiverName: account.helldiverName!,
      players,
    });
    deploy({ code: squadCode, helldiverName: account.helldiverName! });
  };

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <div className="text-center mb-5">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1">
            ◢ Squad Lobby · Pre-Drop Coordination ◣
          </div>
          <div className="text-4xl font-display font-black tracking-tight">
            CALLSIGN <span className="text-helldiver-yellow">{squadCode}</span>
          </div>
          <div className="text-[10px] text-helldiver-dim uppercase tracking-widest mt-1">
            Share this code with up to 3 other Helldivers
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-5">
          <div className="space-y-4">
            {/* Members */}
            <HudFrame label="Squad Roster" accent="yellow" className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => {
                  const m = squad.members[i];
                  if (!m) {
                    return (
                      <div
                        key={i}
                        className="h-32 border-2 border-dashed border-helldiver-steel flex items-center justify-center text-helldiver-dim text-[10px] uppercase tracking-widest"
                      >
                        EMPTY SLOT
                      </div>
                    );
                  }
                  const isMe = m.name === account.helldiverName;
                  return (
                    <div
                      key={m.name}
                      className={clsx(
                        "relative h-32 border-2 p-2",
                        m.ready ? "border-emerald-400" : "border-helldiver-steel",
                        isMe && "ring-2 ring-helldiver-yellow"
                      )}
                    >
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest mb-1">
                        <span className="text-helldiver-dim">SLOT {i + 1}</span>
                        {squad.hostName === m.name && (
                          <span className="text-helldiver-yellow">★ HOST</span>
                        )}
                      </div>
                      <div className="font-display font-black text-base text-helldiver-yellow tracking-wider mb-1 truncate">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-helldiver-dim mb-2">
                        {m.isOnline ? "● ONLINE" : "○ AWAY"}
                      </div>
                      <div className={clsx(
                        "px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold absolute bottom-2 left-2 right-2 text-center",
                        m.ready
                          ? "bg-emerald-500 text-black"
                          : "bg-helldiver-steel text-helldiver-dim"
                      )}>
                        {m.ready ? "✓ READY" : "○ STANDBY"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </HudFrame>

            {/* Mission config */}
            <HudFrame label="Mission Configuration" accent="yellow" className="p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim mb-2">
                {isHost ? "Select Target Planet (Host Only)" : "Awaiting host selection..."}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                {planets.map((p) => {
                  const sel = p.slug === squad.targetPlanetSlug;
                  return (
                    <button
                      key={p._id}
                      disabled={!isHost}
                      onClick={() => handleSetPlanet(p.slug)}
                      className={clsx(
                        "p-2 border-2 text-left transition-all",
                        sel
                          ? "border-helldiver-yellow bg-helldiver-yellow/10 shadow-[0_0_12px_rgba(255, 211, 77,0.4)]"
                          : "border-helldiver-steel hover:border-helldiver-yellow/50",
                        !isHost && "cursor-default opacity-70"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <FactionIcon faction={p.faction} className="w-3 h-3" />
                        <span className="text-[9px] uppercase text-helldiver-dim">{p.faction}</span>
                      </div>
                      <div className="text-xs font-display font-bold tracking-tight text-white">{p.name}</div>
                      <div className="text-[10px] text-helldiver-dim">{p.liberation.toFixed(1)}%</div>
                    </button>
                  );
                })}
              </div>

              {/* Difficulty */}
              <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim mb-2">
                Threat Tier {!isHost && "(Set by Host)"}
              </div>
              <div className="grid grid-cols-10 gap-0.5 mb-3">
                {Array.from({ length: 10 }).map((_, i) => {
                  const active = i < squad.difficulty;
                  return (
                    <button
                      key={i}
                      disabled={!isHost}
                      onClick={() => handleSetDifficulty(i + 1)}
                      className={clsx(
                        "h-7 border font-display font-bold text-[10px]",
                        active
                          ? i + 1 >= 8
                            ? "bg-helldiver-red border-helldiver-red text-white"
                            : i + 1 >= 5
                              ? "bg-helldiver-orange border-helldiver-orange text-black"
                              : "bg-helldiver-yellow border-helldiver-yellow text-black"
                          : "border-helldiver-steel text-helldiver-dim",
                        !isHost && "cursor-default"
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {targetPlanet && modifierIds.length > 0 && (
                <div className="border-t border-helldiver-steel pt-2 mt-2">
                  <div className="text-[10px] uppercase tracking-widest text-helldiver-orange mb-1">
                    ⚠ Sector Modifiers
                  </div>
                  <div className="space-y-0.5">
                    {modifierIds.map((id) => {
                      const m = getModifier(id);
                      if (!m) return null;
                      return (
                        <div key={id} className="text-[10px]">
                          <span className="text-white font-bold">{m.name}</span>{" "}
                          <span className="text-helldiver-dim">— {m.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </HudFrame>
          </div>

          {/* Comms */}
          <SquadChatBox squadCode={squadCode} />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handleLeave}
            className="px-5 py-2 border-2 border-helldiver-red text-helldiver-red hover:bg-helldiver-red hover:text-white text-[10px] uppercase tracking-[0.3em] font-mono transition-colors"
          >
            ✕ Leave Squad
          </button>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleReady}
              className={clsx(
                "px-6 py-3 border-2 font-display font-black uppercase tracking-[0.3em] text-sm transition-all",
                me?.ready
                  ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_18px_rgba(16,185,129,0.5)]"
                  : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
              )}
            >
              {me?.ready ? "✓ READY" : "○ READY UP"}
            </motion.button>

            {isHost && (
              <motion.button
                whileHover={allReady && squad.targetPlanetSlug ? { scale: 1.02 } : {}}
                whileTap={allReady && squad.targetPlanetSlug ? { scale: 0.97 } : {}}
                onClick={handleDeploy}
                disabled={!allReady || !squad.targetPlanetSlug}
                className={clsx(
                  "px-8 py-3 font-display font-black uppercase tracking-[0.3em] border-2 text-sm transition-all",
                  allReady && squad.targetPlanetSlug
                    ? "bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-black border-helldiver-yellow shadow-[0_0_24px_rgba(255, 211, 77,0.5)]"
                    : "border-helldiver-steel text-helldiver-dim cursor-not-allowed"
                )}
              >
                ▶ Deploy Squad
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
