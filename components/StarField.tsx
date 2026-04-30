"use client";

import { useMemo } from "react";

function genStars(count: number, seed: number) {
  let h = seed;
  const next = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 0xffffffff;
  };
  const stars: { x: number; y: number; size: number; o: number }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: next() * 100,
      y: next() * 200, // 200vh tall to allow scroll
      size: next() * 1.6 + 0.4,
      o: next() * 0.6 + 0.3,
    });
  }
  return stars;
}

export default function StarField() {
  const slow = useMemo(() => genStars(80, 0xa1b2c3), []);
  const fast = useMemo(() => genStars(40, 0xd4e5f6), []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-helldiver-dark">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14] via-helldiver-dark to-[#100804]" />
      <div className="absolute inset-x-0 top-0 h-[200vh] animate-stars-slow">
        {slow.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: s.x + "%",
              top: s.y + "vh",
              width: s.size + "px",
              height: s.size + "px",
              opacity: s.o,
              boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,${s.o * 0.5})`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 h-[200vh] animate-stars-fast">
        {fast.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-helldiver-yellow"
            style={{
              left: s.x + "%",
              top: s.y + "vh",
              width: s.size + 0.5 + "px",
              height: s.size + 0.5 + "px",
              opacity: s.o * 0.7,
              boxShadow: `0 0 ${s.size * 3}px rgba(255, 211, 77,${s.o * 0.4})`,
            }}
          />
        ))}
      </div>
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* Slow scanning line */}
      <div className="absolute inset-x-0 top-0 h-32 animate-scan-line bg-gradient-to-b from-transparent via-helldiver-yellow/[0.04] to-transparent" />
    </div>
  );
}
