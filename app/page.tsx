"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import MainMenu from "@/components/MainMenu";
import MapView from "@/components/MapView";
import CombatView from "@/components/CombatView";
import RewardScreen from "@/components/RewardScreen";
import RestScreen from "@/components/RestScreen";
import EndScreen from "@/components/EndScreen";
import GalacticWarScreen from "@/components/GalacticWarScreen";
import LoadoutScreen from "@/components/LoadoutScreen";
import ArmoryScreen from "@/components/ArmoryScreen";
import SquadHub from "@/components/SquadHub";
import SquadLobby from "@/components/SquadLobby";
import CoopCombatView from "@/components/CoopCombatView";

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

  switch (phase) {
    case "menu":
      return <MainMenu />;
    case "armory":
      return <ArmoryScreen />;
    case "squad_hub":
      return <SquadHub />;
    case "squad_lobby":
      return <SquadLobby />;
    case "coop_combat":
      return <CoopCombatView />;
    case "faction":
      return <GalacticWarScreen />;
    case "loadout":
      return <LoadoutScreen />;
    case "map":
      return <MapView />;
    case "combat":
      return <CombatView />;
    case "reward":
      return <RewardScreen />;
    case "rest":
      return <RestScreen />;
    case "victory":
      return <EndScreen victory />;
    case "gameover":
      return <EndScreen victory={false} />;
    default:
      return <MainMenu />;
  }
}
