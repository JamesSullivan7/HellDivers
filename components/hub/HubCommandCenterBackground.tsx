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

// ──────────────────────────────────────────────────────────────────────
//  Overlay gradients — single source of truth for the safe zones
// ──────────────────────────────────────────────────────────────────────
// Lighter safe-zones — let the bridge cinematic breathe. The minimal UI
// pass uses far fewer borders/boxes, so we don't need heavy darkening.
const SAFE_HORIZONTAL =
  "linear-gradient(90deg," +
  " rgba(10,13,18,0.55) 0%," +
  " rgba(10,13,18,0.15) 12%," +
  " rgba(10,13,18,0) 25%," +
  " rgba(10,13,18,0) 75%," +
  " rgba(10,13,18,0.30) 88%," +
  " rgba(10,13,18,0.65) 100%)";

const SAFE_VERTICAL =
  "linear-gradient(180deg," +
  " rgba(10,13,18,0.40) 0%," +
  " rgba(10,13,18,0) 10%," +
  " rgba(10,13,18,0) 72%," +
  " rgba(10,13,18,0.70) 100%)";

const VIGNETTE =
  "radial-gradient(ellipse 90% 70% at 50% 40%," +
  " rgba(10,13,18,0) 0%," +
  " rgba(10,13,18,0) 50%," +
  " rgba(10,13,18,0.55) 100%)";

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

      {/* z-20 — UI safe-zone darkening (horizontal + vertical) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: SAFE_HORIZONTAL }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: SAFE_VERTICAL }}
      />

      {/* z-30 — cinematic vignette + subtle scanlines */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: VIGNETTE }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
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
