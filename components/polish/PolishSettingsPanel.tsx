"use client";

/**
 * PolishSettingsPanel — accessibility + audio sliders.
 *
 * Drop into the settings screen:
 *   <PolishSettingsPanel />
 *
 * Sections:
 *   1. Motion & flash         (reduce motion / flash / shake / simplified VFX)
 *   2. Visual                 (larger text / high contrast)
 *   3. Audio                  (master / music / sfx / voice sliders)
 *   4. Reset to defaults
 *
 * All toggles persist to localStorage via usePolishSettings.
 */

import clsx from "clsx";
import { POLISH_COLOR } from "@/systems/polish/polishTokens";
import { usePolishSettings } from "@/hooks/usePolishSettings";

interface Props {
  className?: string;
  /** When true, renders without section headings + dense spacing (sidebar-friendly). */
  compact?: boolean;
}

export default function PolishSettingsPanel({ className, compact }: Props) {
  const s = usePolishSettings();

  return (
    <div className={clsx("font-mono text-text-primary", className)}>
      <Section title="Motion & Flash" compact={compact}>
        <ToggleRow label="Reduce Motion" hint="Suppress non-essential animations" value={s.reducedMotion} onChange={s.setReducedMotion} />
        <ToggleRow label="Reduce Flash" hint="Suppress screen flashes and strobes" value={s.reducedFlash} onChange={s.setReducedFlash} />
        <ToggleRow label="Reduce Shake" hint="Suppress screen shake on impact" value={s.reducedShake} onChange={s.setReducedShake} />
        <ToggleRow label="Simplified VFX" hint="Cap concurrent effects + disable overlays" value={s.simplifiedVfx} onChange={s.setSimplifiedVfx} />
      </Section>

      <Section title="Visual" compact={compact}>
        <ToggleRow label="Larger Text" hint="Increase body text scale by 110%" value={s.largerText} onChange={s.setLargerText} />
        <ToggleRow label="High Contrast" hint="Stronger borders and increased text contrast" value={s.highContrast} onChange={s.setHighContrast} />
      </Section>

      <Section title="Audio" compact={compact}>
        <SliderRow label="Master" value={s.masterVolume} onChange={(v) => s.setVolume("master", v)} />
        <SliderRow label="Music" value={s.musicVolume} onChange={(v) => s.setVolume("music", v)} />
        <SliderRow label="SFX" value={s.sfxVolume} onChange={(v) => s.setVolume("sfx", v)} />
        <SliderRow label="Voice" value={s.voiceVolume} onChange={(v) => s.setVolume("voice", v)} />
      </Section>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={s.resetToDefaults}
          className="text-[10px] uppercase tracking-widest px-2 py-1 border font-black hover:bg-bg-secondary transition-colors"
          style={{
            color: POLISH_COLOR.textDim,
            borderColor: POLISH_COLOR.borderSubtle,
            borderRadius: 1,
          }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Section frame
// ──────────────────────────────────────────────────────────────────────
function Section({
  title,
  compact,
  children,
}: {
  title: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx("flex flex-col", compact ? "gap-1.5 mb-3" : "gap-2 mb-4")}>
      {!compact && (
        <h3
          className="text-[10px] uppercase tracking-[0.25em] font-display font-black"
          style={{ color: POLISH_COLOR.yellow }}
        >
          {title}
        </h3>
      )}
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ToggleRow
// ──────────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center justify-between gap-3 px-2 py-1.5 border bg-bg-secondary cursor-pointer hover:bg-bg-tertiary transition-colors"
      style={{ borderColor: POLISH_COLOR.borderSubtle, borderRadius: 2 }}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-widest font-black truncate">{label}</span>
        {hint && (
          <span className="text-[9px] truncate" style={{ color: POLISH_COLOR.textDim }}>
            {hint}
          </span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative shrink-0"
        style={{ width: 36, height: 20 }}
      >
        <span
          className="absolute inset-0 transition-colors"
          style={{
            backgroundColor: value ? `${POLISH_COLOR.green}33` : `${POLISH_COLOR.borderSubtle}88`,
            border: `1px solid ${value ? POLISH_COLOR.green : POLISH_COLOR.borderSubtle}`,
            borderRadius: 12,
            boxShadow: value ? `0 0 6px ${POLISH_COLOR.green}55` : undefined,
          }}
        />
        <span
          className="absolute top-[2px]"
          style={{
            left: value ? 18 : 2,
            width: 14,
            height: 14,
            backgroundColor: value ? POLISH_COLOR.green : "rgba(255,255,255,0.55)",
            borderRadius: 7,
            transition: "left 200ms ease, background-color 200ms",
          }}
        />
      </button>
    </label>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  SliderRow
// ──────────────────────────────────────────────────────────────────────
function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div
      className="flex items-center gap-3 px-2 py-1.5 border bg-bg-secondary"
      style={{ borderColor: POLISH_COLOR.borderSubtle, borderRadius: 2 }}
    >
      <span className="text-[10px] uppercase tracking-widest font-black w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="flex-1 accent-yellow-400"
        aria-label={`${label} volume`}
        style={{ accentColor: POLISH_COLOR.yellow }}
      />
      <span className="text-[10px] tabular-nums w-10 text-right" style={{ color: POLISH_COLOR.textDim }}>
        {pct}%
      </span>
    </div>
  );
}
