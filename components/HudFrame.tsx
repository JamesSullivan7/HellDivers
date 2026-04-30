"use client";

import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  label?: string;
  className?: string;
  accent?: "yellow" | "red" | "steel" | "emerald" | "orange";
  glow?: boolean;
  corners?: boolean;
}

const ACCENT: Record<string, string> = {
  yellow: "border-helldiver-yellow/70",
  red: "border-helldiver-red/80",
  steel: "border-helldiver-steel",
  emerald: "border-emerald-500/70",
  orange: "border-helldiver-orange/80",
};

const ACCENT_TEXT: Record<string, string> = {
  yellow: "text-helldiver-yellow",
  red: "text-helldiver-red",
  steel: "text-helldiver-dim",
  emerald: "text-emerald-400",
  orange: "text-helldiver-orange",
};

const ACCENT_GLOW: Record<string, string> = {
  yellow: "shadow-[0_0_30px_rgba(255, 211, 77,0.18),inset_0_1px_0_rgba(255, 211, 77,0.12)]",
  red: "shadow-[0_0_30px_rgba(255, 77, 77,0.18),inset_0_1px_0_rgba(255, 77, 77,0.15)]",
  steel: "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  emerald: "shadow-[0_0_30px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(16,185,129,0.12)]",
  orange: "shadow-[0_0_30px_rgba(255, 211, 77,0.18),inset_0_1px_0_rgba(255, 211, 77,0.12)]",
};

export default function HudFrame({
  children,
  label,
  className,
  accent = "steel",
  glow,
  corners = true,
}: Props) {
  return (
    <div
      className={clsx(
        "relative border bg-gradient-to-b from-helldiver-panel/80 via-helldiver-panel/65 to-black/85 backdrop-blur-md",
        ACCENT[accent],
        ACCENT_GLOW[accent],
        glow && "shadow-[0_0_40px_rgba(255, 211, 77,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* Subtle inner top highlight */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {corners && (
        <>
          <span className={clsx("absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2", ACCENT[accent])} />
          <span className={clsx("absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2", ACCENT[accent])} />
          <span className={clsx("absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2", ACCENT[accent])} />
          <span className={clsx("absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2", ACCENT[accent])} />
        </>
      )}
      {label && (
        <div className={clsx("absolute -top-2 left-3 px-2 bg-helldiver-dark text-[9px] tracking-[0.3em] uppercase font-mono font-bold", ACCENT_TEXT[accent])}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
