"use client";

/**
 * VFX EFFECT COMPONENTS
 * ──────────────────────────────────────────────────────────────────────
 * Each component:
 *   - takes a VFXEvent prop
 *   - positions itself absolutely at event.position (defaults to center)
 *   - animates via Framer Motion + CSS transforms (hardware-friendly)
 *   - returns null when its duration expires (cleanup happens via the
 *     manager's setTimeout removing it from the queue)
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { VFXEvent } from "@/systems/vfx/vfxTypes";
import { getVFXSpec } from "@/systems/vfx/vfxPresets";

// ──────────────────────────────────────────────────────────────────────
//  Centering helper — translates to the event position or viewport center
// ──────────────────────────────────────────────────────────────────────
function positionStyle(event: VFXEvent): React.CSSProperties {
  if (event.position) {
    return {
      left: event.position.x,
      top: event.position.y,
      transform: "translate(-50%, -50%)",
    };
  }
  return {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Explosion — radial burst + ring + debris
// ──────────────────────────────────────────────────────────────────────
export function ExplosionVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const baseRadius = 80 * spec.scale;

  // Deterministic debris angles — keyed by id so they don't re-randomize.
  const debris = useMemo(
    () =>
      Array.from({ length: Math.round(8 * spec.scale) }).map((_, i) => ({
        angle: (i * 360) / Math.max(1, Math.round(8 * spec.scale)),
        distance: baseRadius * (0.7 + ((i * 13) % 30) / 100),
        size: 2 + (i % 3),
        delay: ((i * 17) % 100) / 1000,
      })),
    [event.id, spec.scale, baseRadius]
  );

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {/* Center burst */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: baseRadius * 2,
          height: baseRadius * 2,
          marginLeft: -baseRadius,
          marginTop: -baseRadius,
          background: "radial-gradient(circle, rgba(255,200,80,0.95) 0%, rgba(255,138,40,0.6) 40%, transparent 70%)",
          filter: `blur(${1 + spec.scale}px)`,
        }}
        initial={{ scale: 0.4, opacity: 0.95 }}
        animate={{ scale: [0.4, 1.2, 1.0, 0.85], opacity: [0.95, 0.85, 0.5, 0] }}
        transition={{ duration: dur, ease: "easeOut", times: [0, 0.2, 0.5, 1] }}
      />
      {/* Expanding ring */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: baseRadius * 2,
          height: baseRadius * 2,
          marginLeft: -baseRadius,
          marginTop: -baseRadius,
          border: "2px solid rgba(255,180,80,0.85)",
          boxShadow: "0 0 30px rgba(255,138,40,0.7)",
        }}
        initial={{ scale: 0.3, opacity: 0.95 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: dur * 0.85, ease: "easeOut" }}
      />
      {/* Debris particles */}
      {debris.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * p.distance;
        const dy = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              background: "rgba(255,200,80,0.95)",
              boxShadow: "0 0 4px rgba(255,138,40,0.8)",
            }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: dx, y: dy + 30, opacity: 0 }}
            transition={{ duration: dur, ease: "easeOut", delay: p.delay }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Bullet Hit — small spark burst + 4 quick lines
// ──────────────────────────────────────────────────────────────────────
export function BulletHitVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 20 * spec.scale;

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {/* Flash core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          background: "radial-gradient(circle, rgba(255,240,180,0.95) 0%, rgba(255,180,80,0.5) 40%, transparent 70%)",
          filter: "blur(1px)",
        }}
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
      {/* Four spark lines */}
      {[0, 45, 90, 135].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: radius * 2.4,
              height: 1,
              left: -radius * 1.2,
              top: 0,
              background: "linear-gradient(to right, transparent, rgba(255,240,180,0.95), transparent)",
              transformOrigin: "center",
              transform: `rotate(${angle}deg)`,
            }}
            initial={{ scaleX: 0.2, opacity: 0.9 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: dur, ease: "easeOut", delay: i * 0.01 }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Laser Beam — thin glowing line with pulse + impact dot
//  payload: { dx?, dy? } → vector direction in pixels
// ──────────────────────────────────────────────────────────────────────
export function LaserBeamVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const thickness = 2 + spec.scale * 2;
  const length = (event.payload?.length as number | undefined) ?? 320 * spec.scale;
  const dx = (event.payload?.dx as number | undefined) ?? length;
  const dy = (event.payload?.dy as number | undefined) ?? 0;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const dist = Math.hypot(dx, dy);

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {/* Beam */}
      <motion.div
        className="absolute"
        style={{
          width: dist,
          height: thickness,
          left: 0,
          top: -thickness / 2,
          background: "linear-gradient(to right, rgba(255,77,77,0.95), rgba(255,77,77,0.3))",
          boxShadow: "0 0 18px rgba(255,77,77,0.85), 0 0 36px rgba(255,77,77,0.55)",
          transformOrigin: "left center",
          transform: `rotate(${angle}deg)`,
        }}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: [1, 1, 0] }}
        transition={{ duration: dur, ease: "easeOut", times: [0, 0.5, 1] }}
      />
      {/* Impact glow at endpoint */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 40 * spec.scale,
          height: 40 * spec.scale,
          left: dx - 20 * spec.scale,
          top: dy - 20 * spec.scale,
          background: "radial-gradient(circle, rgba(255,140,80,0.9), transparent 70%)",
          filter: "blur(2px)",
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.2, 1.0], opacity: [0, 0.95, 0] }}
        transition={{ duration: dur, ease: "easeOut", times: [0, 0.4, 1] }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Electric Arc — branching SVG path with flicker
// ──────────────────────────────────────────────────────────────────────
export function ElectricArcVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 60 * spec.scale;

  // Pre-compute jagged segments for the arc
  const points = useMemo(() => {
    const n = 8;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const baseX = (t * 2 - 1) * radius;
      const baseY = Math.sin(t * Math.PI * 1.4) * radius * 0.4;
      const jitter = (Math.sin(i * 17) * radius) * 0.18;
      pts.push({ x: baseX, y: baseY + jitter });
    }
    return pts;
  }, [event.id, radius]);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      <svg
        width={radius * 3}
        height={radius * 2}
        style={{
          position: "absolute",
          left: -radius * 1.5,
          top: -radius,
          overflow: "visible",
        }}
      >
        <motion.path
          d={path}
          stroke="rgba(120,200,255,0.95)"
          strokeWidth={2}
          fill="none"
          style={{
            filter: "drop-shadow(0 0 6px rgba(77,166,255,0.9)) drop-shadow(0 0 12px rgba(77,166,255,0.6))",
          }}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 1, 1, 0.6, 0], pathLength: 1 }}
          transition={{ duration: dur, times: [0, 0.15, 0.5, 0.85, 1] }}
        />
      </svg>
      {/* Center bloom */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius,
          height: radius,
          marginLeft: -radius / 2,
          marginTop: -radius / 2,
          background: "radial-gradient(circle, rgba(120,200,255,0.7), transparent 70%)",
          filter: "blur(2px)",
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.1, 0.9, 0], opacity: [0.95, 0.6, 0.4, 0] }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Gas Cloud — drifting green haze (3 layered circles)
// ──────────────────────────────────────────────────────────────────────
export function GasCloudVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 70 * spec.scale;

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: radius * (1.6 + i * 0.3),
            height: radius * (1.6 + i * 0.3),
            marginLeft: -radius * (0.8 + i * 0.15),
            marginTop: -radius * (0.8 + i * 0.15),
            background: "radial-gradient(circle, rgba(132,204,22,0.55), rgba(101,163,13,0.25) 40%, transparent 70%)",
            filter: "blur(8px)",
            mixBlendMode: "screen",
          }}
          initial={{ scale: 0.5, opacity: 0, x: 0, y: 0 }}
          animate={{
            scale: [0.5, 1.0, 1.15],
            opacity: [0, 0.85, 0.6, 0],
            x: (i - 1) * 18,
            y: -10 - i * 6,
          }}
          transition={{ duration: dur, times: [0, 0.25, 0.6, 1], ease: "easeOut", delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Shield Ripple — hex pattern + concentric ring
// ──────────────────────────────────────────────────────────────────────
export function ShieldRippleVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 70 * spec.scale;

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {/* Hex pattern dome */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          background: "radial-gradient(circle, rgba(77,166,255,0.4) 0%, rgba(77,166,255,0.1) 60%, transparent 80%)",
          backgroundImage:
            "repeating-radial-gradient(circle, rgba(77,166,255,0.5) 0 1px, transparent 1px 14px)",
          backgroundBlendMode: "overlay",
        }}
        initial={{ scale: 0.3, opacity: 0.95 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          border: "2px solid rgba(77,166,255,0.95)",
          boxShadow: "0 0 24px rgba(77,166,255,0.7)",
        }}
        initial={{ scale: 0.4, opacity: 0.95 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Shield Break — sharp crystalline shatter
// ──────────────────────────────────────────────────────────────────────
export function ShieldBreakVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 60 * spec.scale;

  // 6 shard lines pointing outward
  const shards = [0, 60, 120, 180, 240, 300];

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {/* Center flash */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius,
          height: radius,
          marginLeft: -radius / 2,
          marginTop: -radius / 2,
          background: "radial-gradient(circle, rgba(167,139,250,0.95), transparent 70%)",
          filter: "blur(2px)",
        }}
        initial={{ scale: 0.3, opacity: 0.95 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
      {/* Shards */}
      {shards.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad) * radius * 1.4;
        const dy = Math.sin(rad) * radius * 1.4;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: 2,
              height: radius * 0.8,
              marginLeft: -1,
              marginTop: -radius * 0.4,
              background: "rgba(167,139,250,0.95)",
              boxShadow: "0 0 8px rgba(167,139,250,0.85)",
              transformOrigin: "center",
              transform: `rotate(${angle}deg)`,
            }}
            initial={{ x: 0, y: 0, opacity: 0.95, scaleY: 0.4 }}
            animate={{ x: dx, y: dy, opacity: 0, scaleY: 1 }}
            transition={{ duration: dur, ease: "easeOut", delay: i * 0.01 }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Fire Burst — orange flame + ember particles drifting up
// ──────────────────────────────────────────────────────────────────────
export function FireBurstVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 50 * spec.scale;

  // 10 ember particles
  const embers = useMemo(
    () =>
      Array.from({ length: Math.round(10 * spec.scale) }).map((_, i) => ({
        startX: (((i * 31) % 100) - 50) * (radius / 50),
        endX: (((i * 47) % 100) - 50) * (radius / 50) * 0.6,
        endY: -radius * (1 + ((i * 13) % 50) / 100),
        delay: ((i * 23) % 100) / 200,
        size: 1 + (i % 3),
      })),
    [event.id, spec.scale, radius]
  );

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      {/* Flame burst */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 1.6,
          height: radius * 2,
          marginLeft: -radius * 0.8,
          marginTop: -radius,
          background: "radial-gradient(ellipse, rgba(255,180,80,0.9) 0%, rgba(255,77,77,0.7) 40%, transparent 75%)",
          filter: "blur(2px)",
        }}
        initial={{ scaleY: 0.4, scaleX: 0.7, opacity: 0.95 }}
        animate={{ scaleY: [0.4, 1.2, 1.0, 0.6], scaleX: [0.7, 1.0, 0.85, 0.5], opacity: [0.95, 0.8, 0.5, 0] }}
        transition={{ duration: dur, times: [0, 0.25, 0.6, 1], ease: "easeOut" }}
      />
      {/* Embers */}
      {embers.map((e, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: e.size,
            height: e.size,
            marginLeft: -e.size / 2,
            marginTop: -e.size / 2,
            background: "rgba(255,180,80,0.95)",
            boxShadow: "0 0 4px rgba(255,138,40,0.8)",
          }}
          initial={{ x: e.startX, y: 0, opacity: 0.95 }}
          animate={{ x: e.endX, y: e.endY, opacity: 0 }}
          transition={{ duration: dur, ease: "easeOut", delay: e.delay }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Reward Bloom — soft expanding green glow
// ──────────────────────────────────────────────────────────────────────
export function RewardBloomVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 80 * spec.scale;

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          background: "radial-gradient(circle, rgba(52,211,153,0.7), transparent 70%)",
          filter: "blur(4px)",
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.2, 1.6], opacity: [0, 0.95, 0] }}
        transition={{ duration: dur, ease: "easeOut", times: [0, 0.3, 1] }}
      />
      {/* Sparkle */}
      <motion.div
        className="absolute"
        style={{
          width: 4,
          height: 4,
          marginLeft: -2,
          marginTop: -2,
          background: "rgba(245,197,66,0.95)",
          boxShadow: "0 0 16px rgba(245,197,66,0.9)",
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2.5, 4], opacity: [1, 1, 0] }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Card Play Flash — yellow accent flash
// ──────────────────────────────────────────────────────────────────────
export function CardPlayFlashVFX({ event }: { event: VFXEvent }) {
  const spec = getVFXSpec(event.effect, event.intensity);
  const dur = (event.duration ?? spec.durationMs) / 1000;
  const radius = 50 * spec.scale;

  return (
    <div className="absolute pointer-events-none" style={positionStyle(event)}>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          background: "radial-gradient(circle, rgba(245,197,66,0.85), transparent 70%)",
          filter: "blur(2px)",
        }}
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
    </div>
  );
}
