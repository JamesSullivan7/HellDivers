"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import HudFrame from "./HudFrame";
import HubFrame from "./hub/HubFrame";

export default function SquadHub() {
  const { account, goToSquadLobby } = useGame();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useMutation(api.squads.create);
  const join = useMutation(api.squads.join);

  const handleCreate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    sfx.beacon();
    try {
      const result = await create({ hostName: account.helldiverName ?? "Anonymous" });
      goToSquadLobby(result.code);
    } catch (e: any) {
      setError(e.message ?? "Failed to create squad.");
      sfx.alert();
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (busy) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a squad code.");
      sfx.alert();
      return;
    }
    setBusy(true);
    setError(null);
    sfx.click();
    try {
      const result = await join({
        code: trimmed,
        helldiverName: account.helldiverName ?? "Anonymous",
      });
      goToSquadLobby(result.code);
    } catch (e: any) {
      setError(e.message?.replace(/^.*?Error: /, "") ?? "Failed to join squad.");
      sfx.alert();
    } finally {
      setBusy(false);
    }
  };

  return (
    <HubFrame
      title="Form a Squad"
      subtitle="Squad Operations · Joint Deployment"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <p className="text-xs text-center mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
          Up to 4 Helldivers per squad. Live chat, voice comms, and shared planet contributions.
          Each member runs their own combat — squad coordinates and pushes liberation together.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <HudFrame label="Create New Squad" accent="yellow" className="p-5">
            <div className="text-sm text-gray-300 mb-4">
              Open a fresh squad room. Receive a unique callsign code to share with friends.
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              onClick={handleCreate}
              className="w-full py-3 bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-helldiver-dark font-display font-black uppercase tracking-[0.3em] border-2 border-helldiver-yellow shadow-[0_0_18px_rgba(255, 211, 77,0.4)] disabled:opacity-50"
            >
              ▶ Create Squad
            </motion.button>
          </HudFrame>

          <HudFrame label="Join Existing Squad" accent="emerald" className="p-5">
            <div className="text-sm text-gray-300 mb-3">
              Got a squad callsign from a teammate? Drop it in.
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoin();
              }}
              placeholder="BRAVO-1234"
              className="w-full px-3 py-2 bg-black border-2 border-helldiver-steel text-helldiver-yellow font-mono uppercase tracking-widest text-center text-lg mb-3 focus:outline-none focus:border-helldiver-yellow"
              maxLength={20}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              onClick={handleJoin}
              className="w-full py-3 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-display font-black uppercase tracking-[0.3em] border-2 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              ✓ Join Squad
            </motion.button>
          </HudFrame>
        </div>

        {error && (
          <div className="mb-4 p-3 border-2 border-helldiver-red bg-helldiver-red/20 text-helldiver-red text-xs uppercase tracking-widest font-mono text-center">
            ⚠ {error}
          </div>
        )}

      </motion.div>
    </HubFrame>
  );
}
