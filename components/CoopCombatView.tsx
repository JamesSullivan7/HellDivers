"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { getCardById } from "@/lib/cards";
import { ENEMY_TEMPLATES } from "@/lib/enemies";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import CardView from "./CardView";
import EnemyView from "./EnemyView";
import IntelLog from "./IntelLog";
import SquadChatBox from "./SquadChatBox";
import { Card, Enemy } from "@/lib/types";

export default function CoopCombatView() {
  const { account, squadCode, goToMenu, leaveSquad } = useGame();
  const mission = useQuery(api.coop.get, squadCode ? { squadCode } : "skip");
  const playCard = useMutation(api.coop.playCard);
  const endTurn = useMutation(api.coop.endTurn);
  const enterNode = useMutation(api.coop.enterNode);
  const chooseReward = useMutation(api.coop.chooseReward);
  const finalize = useMutation(api.coop.finalizeAndDelete);

  const [selectedHandIdx, setSelectedHandIdx] = useState<number | null>(null);
  const lastHpRef = useRef<number | null>(null);
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(0);

  const me = mission?.players.find((p) => p.name === account.helldiverName);

  // shake/flash on own HP loss
  useEffect(() => {
    if (!me) return;
    if (lastHpRef.current !== null && me.hp < lastHpRef.current) {
      setShake((n) => n + 1);
      setFlash((n) => n + 1);
    }
    lastHpRef.current = me.hp;
  }, [me?.hp]);

  if (!squadCode) {
    return (
      <div className="min-h-screen bg-helldiver-dark text-white flex items-center justify-center">
        <button onClick={goToMenu} className="text-helldiver-yellow underline">
          Squad disconnected. Return to HQ.
        </button>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-helldiver-dark text-white flex items-center justify-center font-mono text-helldiver-yellow">
        Connecting to squad mission...
      </div>
    );
  }

  // === STATUS-BASED VIEWS ===

  // Map view
  if (mission.status === "map") {
    return <CoopMap mission={mission} onEnter={(idx) => { sfx.beacon(); enterNode({ squadCode, nodeIndex: idx }); }} onExit={() => { finalize({ squadCode }); leaveSquad(); }} />;
  }

  if (mission.status === "victory") {
    return (
      <CoopEndScreen
        mission={mission}
        victory
        onReturn={() => {
          finalize({ squadCode });
          leaveSquad();
        }}
      />
    );
  }
  if (mission.status === "gameover") {
    return (
      <CoopEndScreen
        mission={mission}
        victory={false}
        onReturn={() => {
          finalize({ squadCode });
          leaveSquad();
        }}
      />
    );
  }

  if (mission.status === "reward") {
    return (
      <CoopRewardScreen
        mission={mission}
        meName={account.helldiverName ?? ""}
        onPick={(cardId) => chooseReward({ squadCode, helldiverName: account.helldiverName!, cardId: cardId ?? undefined })}
      />
    );
  }

  // Combat view (default)
  if (!me) return <div className="text-white p-6">You're not in this mission.</div>;

  const myHand: Card[] = me.handIds.map((id: string) => getCardById(id));
  const selectedCard = selectedHandIdx !== null ? myHand[selectedHandIdx] : null;
  const needsTarget = selectedCard?.target === "single";

  const enemies: Enemy[] = mission.enemies.map((e: any) => {
    const tmpl = ENEMY_TEMPLATES[e.templateId];
    const pattern = e.enraged && tmpl?.enragedPattern ? tmpl.enragedPattern : tmpl?.intentPattern ?? [{ kind: "wait", text: "..." }];
    return {
      ...e,
      faction: e.faction as Enemy["faction"],
      intents: pattern,
    };
  });

  const handleCardClick = (idx: number) => {
    sfx.unlock();
    const card = myHand[idx];
    if (me.requisition < card.cost) {
      sfx.alert();
      return;
    }
    if (card.target === "single") {
      sfx.cardSelect();
      setSelectedHandIdx(selectedHandIdx === idx ? null : idx);
    } else {
      sfx.cardPlay();
      playCard({ squadCode, helldiverName: account.helldiverName!, handIndex: idx });
    }
  };

  const handleEnemyClick = (enemyId: string) => {
    if (selectedHandIdx === null) return;
    sfx.cardPlay();
    playCard({ squadCode, helldiverName: account.helldiverName!, handIndex: selectedHandIdx, enemyId });
    setSelectedHandIdx(null);
  };

  const handleEndTurn = () => {
    sfx.endTurn();
    endTurn({ squadCode, helldiverName: account.helldiverName! });
  };

  const myEndedTurn = mission.endedTurns.includes(account.helldiverName ?? "");

  return (
    <motion.div
      animate={shake > 0 ? { x: [0, -10, 10, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen text-white px-4 py-3 relative"
    >
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => setFlash(0)}
            className="fixed inset-0 bg-helldiver-red pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      <StarField />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mb-4">
          <div className="space-y-3">
            <HudFrame label={`Hostile Contacts · Co-op · Turn ${mission.turn}`} accent="red" className="p-4 pt-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {enemies.map((e) => (
                  <EnemyView
                    key={e.id}
                    enemy={e}
                    targetable={needsTarget}
                    needsTarget={needsTarget}
                    onClick={() => handleEnemyClick(e.id)}
                  />
                ))}
              </div>
            </HudFrame>

            {mission.sentries.length > 0 && (
              <HudFrame label="Active Stratagems" accent="emerald" className="p-2">
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {mission.sentries.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2 py-1 border border-emerald-700 bg-emerald-900/20 text-emerald-300"
                    >
                      <span className="font-bold">{s.name}</span>
                      <span className="ml-1 text-emerald-500">({s.ownerName})</span>
                      <span className="ml-2 text-emerald-500">{s.turnsLeft}T</span>
                    </span>
                  ))}
                </div>
              </HudFrame>
            )}
          </div>

          <div className="space-y-3">
            <HudFrame label="Squad Status · Live" accent="yellow" className="p-3">
              <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mb-2">
                Reinforcements: <span className="text-helldiver-yellow font-bold">{mission.sharedReinforcements}</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {mission.players.map((p: any) => {
                  const isMe = p.name === account.helldiverName;
                  const ended = mission.endedTurns.includes(p.name);
                  const hpPct = p.maxHp > 0 ? (p.hp / p.maxHp) * 100 : 0;
                  return (
                    <div
                      key={p.name}
                      className={clsx(
                        "border px-2 py-1.5",
                        p.dead && "opacity-40",
                        isMe ? "border-helldiver-yellow bg-helldiver-yellow/5" : "border-helldiver-steel/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={clsx("font-bold truncate", isMe ? "text-helldiver-yellow" : "text-white")}>
                          {p.name}{isMe && " (YOU)"}
                        </span>
                        <span className={clsx("text-[9px] tracking-widest font-bold",
                          p.dead ? "text-helldiver-red" : ended ? "text-emerald-400" : "text-helldiver-yellow"
                        )}>
                          {p.dead ? "✕ KIA" : ended ? "✓ READY" : "● ACTIVE"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black border border-helldiver-steel relative">
                        <div className={clsx("h-full", hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-helldiver-yellow" : "bg-helldiver-red")} style={{ width: `${hpPct}%` }} />
                      </div>
                      <div className="flex justify-between mt-0.5 text-[9px] text-helldiver-dim">
                        <span>{p.hp}/{p.maxHp} HP</span>
                        <span>{p.requisition}R · Hand {p.handIds.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </HudFrame>

            <motion.button
              whileHover={!myEndedTurn ? { scale: 1.02 } : {}}
              whileTap={!myEndedTurn ? { scale: 0.97 } : {}}
              onClick={handleEndTurn}
              disabled={myEndedTurn}
              className={clsx(
                "w-full font-display font-black py-3 border-2 uppercase tracking-[0.3em] text-sm transition-all",
                myEndedTurn
                  ? "bg-emerald-700 border-emerald-400 text-white cursor-default"
                  : "bg-gradient-to-b from-helldiver-red to-red-800 text-white border-helldiver-red shadow-[0_0_18px_rgba(255, 77, 77,0.5)]"
              )}
            >
              {myEndedTurn ? `Waiting (${mission.endedTurns.length}/${mission.players.filter((p: any) => !p.dead).length})` : "End Turn ▸"}
            </motion.button>

            <IntelLogCoop log={mission.log} />

            {squadCode && <SquadChatBox squadCode={squadCode} compact />}
          </div>
        </div>

        <div className="border-t border-helldiver-yellow/30 pt-3">
          <div className="flex items-center justify-between mb-2 text-[10px] tracking-[0.25em] uppercase">
            <div className="text-helldiver-dim flex gap-3">
              <span>You: <span className="text-helldiver-yellow">{me.hp}/{me.maxHp} HP</span></span>
              <span className="text-helldiver-steel">|</span>
              <span>R: <span className="text-helldiver-yellow">{me.requisition}/{me.maxRequisition}</span></span>
              <span className="text-helldiver-steel">|</span>
              <span>Block: <span className="text-sky-400">{me.block}</span></span>
              <span className="text-helldiver-steel">|</span>
              <span>Hand: {me.handIds.length} · Deck: {me.deckIds.length} · Discard: {me.discardIds.length}</span>
            </div>
            {selectedCard && needsTarget && (
              <div className="text-helldiver-yellow font-display font-bold tracking-[0.25em] animate-blink">
                ▶ SELECT TARGET
              </div>
            )}
          </div>
          <div className="hand-strip">
            {myHand.map((card, idx) => (
              <CardView
                key={`${card.id}-${idx}`}
                card={card}
                selected={selectedHandIdx === idx}
                affordable={me.requisition >= card.cost && !myEndedTurn}
                onClick={() => !myEndedTurn && handleCardClick(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// === Sub-components for status branches ===

function IntelLogCoop({ log }: { log: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log.length]);
  return (
    <HudFrame label="Intel Feed" accent="emerald" className="p-2">
      <div ref={ref} className="font-mono text-[11px] h-32 overflow-y-auto pr-1">
        {log.slice(-50).map((line, i) => (
          <div key={i} className={
            line.startsWith(">")
              ? "text-helldiver-yellow font-bold tracking-wide"
              : line.startsWith("  [")
                ? "text-emerald-400"
                : "text-gray-400"
          }>
            {line}
          </div>
        ))}
      </div>
    </HudFrame>
  );
}

function CoopMap({ mission, onEnter, onExit }: { mission: any; onEnter: (idx: number) => void; onExit: () => void }) {
  const nextIndex = (() => {
    if (mission.currentNode < 0) return 0;
    if (mission.map[mission.currentNode]?.cleared) return mission.currentNode + 1;
    return mission.currentNode;
  })();

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1">
            ◢ Squad Operation · Live ◣
          </div>
          <div className="text-3xl font-display font-black tracking-tight">
            CO-OP DEPLOYMENT — <span className="text-helldiver-yellow">{mission.planetSlug.toUpperCase()}</span>
          </div>
          <div className="text-[10px] text-helldiver-dim uppercase tracking-widest mt-1">
            Reinforcements: {mission.sharedReinforcements} · Squad: {mission.players.length}
          </div>
        </div>

        <HudFrame label="Operation Path" accent="yellow" className="p-4 mb-4">
          <div className="space-y-2">
            {mission.map.map((node: any, i: number) => {
              const current = i === nextIndex;
              const cleared = node.cleared;
              return (
                <button
                  key={i}
                  disabled={!current}
                  onClick={() => onEnter(i)}
                  className={clsx(
                    "w-full flex items-center gap-3 p-3 border-2 text-left",
                    current && "border-helldiver-yellow bg-helldiver-yellow/10 animate-pulse-yellow",
                    cleared && "border-emerald-700 opacity-60",
                    !current && !cleared && "border-helldiver-steel/40 opacity-40"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 flex items-center justify-center border-2 font-display font-black text-xl",
                    node.type === "boss" ? "border-helldiver-red text-helldiver-red"
                    : node.type === "elite" ? "border-helldiver-orange text-helldiver-orange"
                    : node.type === "rest" ? "border-emerald-500 text-emerald-400"
                    : "border-helldiver-yellow text-helldiver-yellow"
                  )}>
                    {node.type === "boss" ? "★" : node.type === "elite" ? "☠" : node.type === "rest" ? "✚" : "✦"}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim">
                      Node {i + 1} · {node.type.toUpperCase()}
                    </div>
                    <div className="text-sm font-display font-bold tracking-wider">
                      {node.enemyTemplateIds.length > 0
                        ? `${node.enemyTemplateIds.length} hostiles`
                        : "Secure zone"}
                    </div>
                  </div>
                  {current && <div className="text-helldiver-yellow text-xs animate-blink">► DEPLOY</div>}
                  {cleared && <div className="text-emerald-400 text-xs">✓ CLEARED</div>}
                </button>
              );
            })}
          </div>
        </HudFrame>

        <div className="flex justify-center">
          <button
            onClick={onExit}
            className="px-6 py-2 border-2 border-helldiver-red text-helldiver-red hover:bg-helldiver-red hover:text-white text-[10px] uppercase tracking-[0.3em] font-mono transition-colors"
          >
            ✕ Abort Mission
          </button>
        </div>
      </div>
    </div>
  );
}

function CoopRewardScreen({ mission, meName, onPick }: { mission: any; meName: string; onPick: (cardId: string | null) => void }) {
  const me = mission.players.find((p: any) => p.name === meName);
  const choices = me?.rewardChoices ?? [];
  const cards: Card[] = choices.map((id: string) => getCardById(id));

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />
      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <HudFrame accent="yellow" glow className="p-6 mb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1">
            ▶ Mission Reward · Squad Co-op
          </div>
          <div className="text-3xl font-display font-black tracking-tight">
            {me?.finishedReward ? "AWAITING SQUAD" : "PICK YOUR STRATAGEM"}
          </div>
          <div className="text-xs text-gray-300 mt-2">
            Each squad member picks independently. Mission resumes once all are done.
          </div>
        </HudFrame>

        {!me?.finishedReward && (
          <>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {cards.map((c) => (
                <CardView key={c.id} card={c} onClick={() => onPick(c.id)} />
              ))}
            </div>
            <button
              onClick={() => onPick(null)}
              className="px-6 py-2 border-2 border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow text-[10px] uppercase tracking-[0.3em] font-mono"
            >
              ✕ Skip
            </button>
          </>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-2">
          {mission.players.map((p: any) => (
            <div key={p.name} className={clsx(
              "border px-2 py-1 text-[11px] font-mono",
              p.finishedReward ? "border-emerald-400 text-emerald-400" : "border-helldiver-steel text-helldiver-dim"
            )}>
              {p.finishedReward ? "✓" : "○"} {p.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoopEndScreen({ mission, victory, onReturn }: { mission: any; victory: boolean; onReturn: () => void }) {
  useEffect(() => {
    if (victory) sfx.victory(); else sfx.defeat();
  }, [victory]);
  return (
    <div className="min-h-screen text-white font-mono p-6 flex items-center justify-center relative">
      <StarField />
      <div className="max-w-xl w-full relative z-10 text-center">
        <HudFrame accent={victory ? "yellow" : "red"} glow className="p-8">
          <div className={clsx("text-[10px] uppercase tracking-[0.4em] mb-2", victory ? "text-helldiver-yellow" : "text-helldiver-red")}>
            {victory ? "▶ Squad Mission Accomplished" : "▶ Squad Wiped"}
          </div>
          <div className="text-5xl font-display font-black mb-3 tracking-tight">
            {victory ? "VICTORY" : "MISSION FAILED"}
          </div>
          <div className="text-sm text-gray-300 mb-6">
            {victory
              ? "Planet liberated as a squad. Democracy advances."
              : "Reinforcements depleted. The squad has fallen."}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6 text-[11px]">
            {mission.players.map((p: any) => (
              <div key={p.name} className="border border-helldiver-steel/50 p-2">
                <div className="font-bold text-helldiver-yellow">{p.name}</div>
                <div className="text-helldiver-dim">{p.kills} kills</div>
              </div>
            ))}
          </div>
          <button
            onClick={onReturn}
            className="w-full bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-helldiver-dark font-display font-black py-3 uppercase tracking-[0.3em] border-2 border-helldiver-yellow"
          >
            ⌂ Return to HQ
          </button>
        </HudFrame>
      </div>
    </div>
  );
}
