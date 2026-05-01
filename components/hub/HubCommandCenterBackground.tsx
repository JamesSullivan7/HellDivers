"use client";

/**
 * HUB · COMMAND CENTER BACKGROUND
 * ──────────────────────────────────────────────────────────────────────
 * Cinematic 5-layer composite that sits behind the entire Hub UI.
 *
 *   z-50  UI panels                                (rendered by HubScreen)
 *   z-40  Atmosphere particles (dust + sparks)
 *   z-30  Vignette + scanlines
 *   z-20  UI safe-zone darkening (horiz + vert)
 *   z-10  Hero plate <picture> with avif/webp/jpg
 *   z-0   Solid #0a0d12 fallback
 *
 * Asset path:
 *   /public/art/hub/command_center.{avif,webp,jpg}
 *   /public/art/hub/command_center_mobile.{avif,webp,jpg}
 *
 * The picture element uses three encodings; the browser picks the best
 * supported. Until the assets exist on disk the <img> errors silently
 * and the solid fallback shows. Drop the cropped hero art at those paths
 * and the hub picks it up on the next refresh — no code change needed.
 */

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

// Solid side panels block the bridge edges directly, so safe-zone
// gradients are no longer needed. Only the scanline pattern remains for
// the very subtle CRT texture.
const SCANLINES =
  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)";

export default function HubCommandCenterBackground() {
  const reduced = useReducedMotionSafe();

  return (
    <>
      {/* z-0  — solid fallback when image hasn't loaded yet / asset missing */}
      <div className="absolute inset-0" style={{ background: "#0a0d12" }} aria-hidden />

      {/* z-10 — hero plate. JPEG-only for now; AVIF/WebP can be added later
          and re-introduced as <source> entries when they exist on disk. */}
      <img
        src="/art/hub/command_center.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center 35%" }}
        loading="eager"
        decoding="async"
        onError={(e) => {
          // If the asset is missing, fade to 0 so the solid #0a0d12 fallback
          // shows instead of a broken-image icon.
          (e.currentTarget as HTMLImageElement).style.opacity = "0";
        }}
      />

      {/* The hub uses solid side panels that sit OVER this background, so
          the bridge image only shows in the center column. No safe-zone
          darkening is applied to the cinematic — the player sees it clean.
          Only a very subtle vignette remains for atmospheric depth. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 90% at 50% 45%, rgba(10,13,18,0) 0%, rgba(10,13,18,0) 70%, rgba(10,13,18,0.35) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: SCANLINES }}
      />

      {/* z-40 — atmosphere (suppressed under reduced motion) */}
      {!reduced && <DustLayer />}
      {!reduced && <SparkLayer />}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Dust drift — 14 particles, very subtle, slow horizontal traversal
// ──────────────────────────────────────────────────────────────────────
function DustLayer() {
  const dust = Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    top: `${(i * 73) % 100}%`,
    size: 1 + (i % 2),
    delay: (i * 1.7) % 12,
    duration: 90 + ((i * 11) % 70),
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {dust.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full"
          style={{
            top: d.top,
            width: d.size,
            height: d.size,
            background: "rgba(255,255,255,0.5)",
            filter: "blur(0.5px)",
            opacity: 0.15,
          }}
          initial={{ x: "-5vw" }}
          animate={{ x: "105vw" }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Spark layer — 3 warm orange sparks rising periodically
// ──────────────────────────────────────────────────────────────────────
function SparkLayer() {
  const sparks = [0, 1, 2];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {sparks.map((i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            left: `${20 + i * 28}%`,
            bottom: "18%",
            width: 2,
            height: 2,
            background: "#ff8a28",
            boxShadow: "0 0 6px #ff8a28aa",
            borderRadius: "50%",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, -120, -200], opacity: [0, 0.65, 0] }}
          transition={{
            duration: 4 + i,
            delay: i * 2.4,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
