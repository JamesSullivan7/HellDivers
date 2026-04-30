"use client";

const MESSAGES = [
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
  "DECLINE TO REPORT? UNFORTUNATE",
  "LIBERATE THE GALAXY",
  "BUGS BURN BEAUTIFULLY",
  "EAGLE-1 ALWAYS WATCHING",
];

export default function PropagandaTicker() {
  const items = [...MESSAGES, ...MESSAGES]; // double for seamless loop
  return (
    <div className="relative overflow-hidden border-y border-helldiver-yellow/30 bg-black/60 backdrop-blur-sm">
      <div className="flex animate-ticker whitespace-nowrap py-1 text-[10px] tracking-[0.3em] font-mono text-helldiver-yellow/80">
        {items.map((m, i) => (
          <span key={i} className="px-8 flex items-center gap-3">
            <span className="text-helldiver-red">?</span>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
