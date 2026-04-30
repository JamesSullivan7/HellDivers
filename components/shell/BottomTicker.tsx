"use client";

const PROPAGANDA = [
  "DEMOCRACY OFFICER IS WATCHING",
  "LIBERTY PREVAILS",
  "FREEDOM IS NON-NEGOTIABLE",
  "MANAGED DEMOCRACY ACHIEVED",
  "REPORT SUSPICIOUS BUGS",
  "FOR SUPER EARTH",
  "TREASON WILL NOT BE TOLERATED",
  "SPREAD MANAGED DEMOCRACY",
  "EVERY HELLDIVER COUNTS",
  "PEACE THROUGH SUPERIOR FIREPOWER",
  "COMPLY WITH OFFICER DIRECTIVES",
  "EAGLE-1 ALWAYS WATCHING",
  "LIBERATION PROGRESS INCREASING",
  "PLANET LIBERATION +2.3%",
];

export default function BottomTicker() {
  const items = [...PROPAGANDA, ...PROPAGANDA];
  return (
    <footer
      className="relative z-ui w-full border-t border-border-strong bg-black/70 backdrop-blur-sm overflow-hidden"
      style={{ height: "32px" }}
    >
      <div className="flex animate-ticker whitespace-nowrap py-[7px] text-[10px] tracking-[0.3em] font-mono text-accent-yellow/80 leading-none">
        {items.map((m, i) => (
          <span key={i} className="px-tok-7 flex items-center gap-tok-2">
            <span className="text-accent-red">▸</span>
            {m}
          </span>
        ))}
      </div>
    </footer>
  );
}
