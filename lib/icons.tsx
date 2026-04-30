import { CardType } from "./types";

export function StratagemArrows({ pattern, className }: { pattern: string[]; className?: string }) {
  const map: Record<string, string> = {
    U: "↑",
    D: "↓",
    L: "←",
    R: "→",
  };
  return (
    <span className={className}>
      {pattern.map((p, i) => (
        <span key={i} className="inline-block px-0.5 text-helldiver-yellow">
          {map[p] ?? "·"}
        </span>
      ))}
    </span>
  );
}

interface IconProps {
  type: CardType;
  className?: string;
}

export function StratagemIcon({ type, className = "w-8 h-8" }: IconProps) {
  switch (type) {
    case "eagle":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 18 L16 6 L30 18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 6 V18" strokeLinecap="round" />
          <path d="M8 22 H24" strokeLinecap="round" />
          <circle cx="16" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
    case "orbital":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="16" cy="16" r="11" />
          <circle cx="16" cy="16" r="6" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
          <path d="M16 1 V5 M16 27 V31 M1 16 H5 M27 16 H31" strokeLinecap="round" />
        </svg>
      );
    case "sentry":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="10" y="14" width="12" height="14" />
          <rect x="6" y="28" width="20" height="2" />
          <path d="M16 14 V6 L24 4" strokeLinecap="round" />
          <circle cx="24" cy="4" r="1.5" fill="currentColor" />
          <line x1="13" y1="20" x2="19" y2="20" />
        </svg>
      );
    case "support":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 22 L14 11 L18 15 L29 4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="12" y="20" width="14" height="3" />
          <line x1="6" y1="28" x2="26" y2="28" strokeLinecap="round" />
        </svg>
      );
    case "backpack":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="6" width="16" height="22" rx="2" />
          <rect x="12" y="3" width="8" height="4" />
          <line x1="11" y1="14" x2="21" y2="14" />
          <line x1="11" y1="20" x2="21" y2="20" />
        </svg>
      );
    case "utility":
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 3 L20 12 L29 13 L22 20 L24 29 L16 24 L8 29 L10 20 L3 13 L12 12 Z" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function CardArrowPattern({ id }: { id: string }) {
  // deterministic pseudo-random arrow pattern from id
  const arrows = ["U", "D", "L", "R"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const len = 4 + (h % 3); // 4-6 arrows
  const pattern: string[] = [];
  for (let i = 0; i < len; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    pattern.push(arrows[h % 4]);
  }
  return <StratagemArrows pattern={pattern} className="text-xs tracking-wider" />;
}

export function HellpodIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 4 L24 18 L24 26 L16 30 L8 26 L8 18 Z" strokeLinejoin="round" />
      <line x1="12" y1="20" x2="20" y2="20" />
      <line x1="12" y1="24" x2="20" y2="24" />
    </svg>
  );
}

export function SkullIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C7 2 4 5 4 10c0 3 1 5 3 6v3a2 2 0 002 2h6a2 2 0 002-2v-3c2-1 3-3 3-6 0-5-3-8-8-8zm-3 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-4.5 4l1.5-2 1.5 2-1.5 2-1.5-2z"/>
    </svg>
  );
}

export function FactionIcon({ faction, className = "w-5 h-5" }: { faction: "terminid" | "automaton" | "illuminate"; className?: string }) {
  if (faction === "terminid") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2c-2 0-3 1-3 2 0 0-3 1-3 4 0 1 1 2 1 2s-2 1-2 3c0 1 1 2 2 2 0 2 2 4 5 4s5-2 5-4c1 0 2-1 2-2 0-2-2-3-2-3s1-1 1-2c0-3-3-4-3-4 0-1-1-2-3-2z"/>
      </svg>
    );
  }
  if (faction === "automaton") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="4" width="12" height="14" />
        <line x1="9" y1="9" x2="9" y2="9.01" strokeLinecap="round" />
        <line x1="15" y1="9" x2="15" y2="9.01" strokeLinecap="round" />
        <line x1="9" y1="14" x2="15" y2="14" />
        <line x1="9" y1="18" x2="9" y2="22" />
        <line x1="15" y1="18" x2="15" y2="22" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="3" x2="12" y2="7" />
    </svg>
  );
}
