"use client";

/**
 * Audio Settings popover — master volume + per-layer mixer + mute.
 * Sits in the HubScreen top-bar settings cluster. State + persistence
 * are handled by lib/audioMixer.ts.
 */

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  AudioLayer,
  MixerState,
  getMixerState,
  initAudioMixer,
  setLayerVolume,
  setMaster,
  setMuted,
  subscribeMixer,
} from "@/lib/audioMixer";
import { sfx } from "@/lib/sfx";

const LAYER_LABELS: Record<AudioLayer, { label: string; color: string; sample: () => void }> = {
  ui: { label: "UI", color: "#f5c542", sample: () => sfx.click() },
  combat: { label: "Combat", color: "#ff4d4d", sample: () => sfx.hit() },
  ambient: { label: "Ambient", color: "#a78bfa", sample: () => sfx.distantBoom() },
  voice: { label: "Voice", color: "#4da6ff", sample: () => sfx.voice("Audio test. For Super Earth.") },
};

export default function AudioSettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<MixerState | null>(null);

  useEffect(() => {
    initAudioMixer();
    setState(getMixerState());
    return subscribeMixer((s) => setState(s));
  }, []);

  if (!state) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="fixed top-16 right-4 z-[70] w-[340px] border-2 backdrop-blur-md p-4"
            style={{
              borderColor: "#f5c542",
              background: "rgba(17, 24, 33, 0.96)",
              boxShadow: "0 0 30px rgba(245,197,66,0.18)",
            }}
          >
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: "#f5c542", margin: "-1px" }} />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: "#f5c542", margin: "-1px" }} />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: "#f5c542", margin: "-1px" }} />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: "#f5c542", margin: "-1px" }} />

            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow font-display font-black">
                ◢ Audio Mixer ◣
              </div>
              <button
                onClick={onClose}
                className="text-[10px] uppercase tracking-widest text-white/40 hover:text-helldiver-yellow"
              >
                ✕ Close
              </button>
            </div>

            {/* Mute toggle */}
            <button
              onClick={() => {
                sfx.unlock();
                sfx.click();
                setMuted(!state.muted);
              }}
              className={clsx(
                "w-full mb-3 py-2 px-3 border-2 font-display font-bold uppercase tracking-[0.3em] text-xs transition-colors text-left flex items-center justify-between",
                state.muted
                  ? "border-helldiver-red text-helldiver-red bg-helldiver-red/10"
                  : "border-emerald-400 text-emerald-300 bg-emerald-400/5"
              )}
            >
              <span>{state.muted ? "🔇  Audio Muted" : "🔊  Audio Live"}</span>
              <span className="text-[9px] tracking-widest">CLICK TO TOGGLE</span>
            </button>

            {/* Master */}
            <Slider
              label="Master"
              accent="#f5c542"
              value={state.master}
              onChange={(v) => setMaster(v)}
              showSample={false}
            />

            <div className="my-3 border-t border-white/10" />

            <div className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-2">Layers</div>

            {(Object.keys(LAYER_LABELS) as AudioLayer[]).map((layer) => (
              <Slider
                key={layer}
                label={LAYER_LABELS[layer].label}
                accent={LAYER_LABELS[layer].color}
                value={state.layers[layer]}
                onChange={(v) => setLayerVolume(layer, v)}
                onSample={() => {
                  sfx.unlock();
                  LAYER_LABELS[layer].sample();
                }}
                showSample
              />
            ))}

            <div className="mt-3 pt-3 border-t border-white/10 text-[9px] uppercase tracking-widest text-white/30 leading-relaxed">
              Settings persist across sessions. Click any layer's <span className="text-helldiver-yellow">▶</span> button to hear a sample.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Slider({
  label,
  accent,
  value,
  onChange,
  onSample,
  showSample,
}: {
  label: string;
  accent: string;
  value: number;
  onChange: (v: number) => void;
  onSample?: () => void;
  showSample: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-bold"
            style={{ color: accent }}
          >
            {label}
          </span>
          {showSample && onSample && (
            <button
              onClick={onSample}
              className="px-1.5 py-0 border text-[9px] uppercase tracking-widest hover:bg-white/5"
              style={{ borderColor: `${accent}80`, color: accent }}
              title="Sample this layer"
            >
              ▶
            </button>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-white/60 font-mono">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full h-1.5 appearance-none cursor-pointer bg-black/60 border border-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-current [&::-webkit-slider-thumb]:cursor-grab"
        style={{
          color: accent,
          accentColor: accent,
        }}
      />
    </div>
  );
}
