"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import HubScreen from "@/components/HubScreen";
import MapView from "@/components/MapView";
import CombatView from "@/components/CombatView";
import RewardScreen from "@/components/RewardScreen";
import RestScreen from "@/components/RestScreen";
import EventScreen from "@/components/EventScreen";
import ShopScreen from "@/components/ShopScreen";
import EndScreen from "@/components/EndScreen";
import GalacticWarScreen from "@/components/GalacticWarScreen";
import LoadoutScreen from "@/components/LoadoutScreen";
import ArmoryScreen from "@/components/ArmoryScreen";
import CharacterSheet from "@/components/CharacterSheet";
import CodexScreen from "@/components/CodexScreen";
import SquadHub from "@/components/SquadHub";
import SquadLobby from "@/components/SquadLobby";
import CoopCombatView from "@/components/CoopCombatView";
import ObjectiveToast from "@/components/ObjectiveToast";
import TensionProvider from "@/components/tension/TensionProvider";
import TensionOverlay from "@/components/tension/TensionOverlay";
import TensionDebugPanel from "@/components/tension/TensionDebugPanel";
import EventFeedHud from "@/components/hud/EventFeedHud";
import ImpactFlash from "@/components/vfx/ImpactFlash";
import ScreenShake from "@/components/vfx/ScreenShake";
import VFXLayer from "@/components/vfx/VFXLayer";
import VFXProvider from "@/components/vfx/VFXProvider";
import ProgressionProvider from "@/components/progression/ProgressionProvider";
import PageTransitionProvider from "@/components/transitions/PageTransitionProvider";
import PageTransitionWrapper from "@/components/transitions/PageTransitionWrapper";
import TransitionOverlay from "@/components/transitions/TransitionOverlay";

const IN_RUN_PHASES = new Set(["map", "combat", "reward", "rest", "event", "shop"]);

export default function Page() {
  const phase = useGame((s) => s.phase);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-helldiver-dark flex items-center justify-center font-mono text-helldiver-yellow text-xs uppercase tracking-[0.4em]">
        ◢ Initializing Helldiver Profile ◣
      </div>
    );
  }

  let view: React.ReactNode;
  switch (phase) {
    case "menu":
      view = <HubScreen />;
      break;
    case "armory":
      view = <ArmoryScreen />;
      break;
    case "character":
      view = <CharacterSheet />;
      break;
    case "codex":
      view = <CodexScreen />;
      break;
    case "squad_hub":
      view = <SquadHub />;
      break;
    case "squad_lobby":
      view = <SquadLobby />;
      break;
    case "coop_combat":
      view = <CoopCombatView />;
      break;
    case "faction":
      view = <GalacticWarScreen />;
      break;
    case "loadout":
      view = <LoadoutScreen />;
      break;
    case "map":
      view = <MapView />;
      break;
    case "combat":
      view = <CombatView />;
      break;
    case "reward":
      view = <RewardScreen />;
      break;
    case "rest":
      view = <RestScreen />;
      break;
    case "event":
      view = <EventScreen />;
      break;
    case "shop":
      view = <ShopScreen />;
      break;
    case "victory":
      view = <EndScreen victory />;
      break;
    case "gameover":
      view = <EndScreen victory={false} />;
      break;
    default:
      view = <HubScreen />;
  }

  return (
    <>
      {/* ScreenShake wraps the entire app so feedback events can shake the world without a remount cost on each shake. */}
      <ScreenShake>
        {/* PageTransitionWrapper handles AnimatePresence between phase swaps. */}
        <PageTransitionWrapper>
          {view}
        </PageTransitionWrapper>
      </ScreenShake>

      {IN_RUN_PHASES.has(phase) && <ObjectiveToast />}

      {/* Game-feel layer — toast feed + impact flash float above the app. */}
      <EventFeedHud />
      <ImpactFlash />

      {/* VFX system — provider bridges feedback events into VFX, layer renders all active effects. */}
      <VFXProvider />
      <VFXLayer />

      {/* Progression system — watches the unlock queue + renders the cinematic reveal modal. */}
      <ProgressionProvider />

      {/* Transition layer — provider watches phase, overlay renders the visual choreography. */}
      <PageTransitionProvider />
      <TransitionOverlay />

      {/* Tension system — provider runs always (no-op outside runs);
          overlay only renders for alert+; debug panel is opt-in. */}
      <TensionProvider />
      <TensionOverlay />
      <TensionDebugPanel />
    </>
  );
}
