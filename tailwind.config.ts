import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./game/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./systems/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── New token system (referenced via CSS vars) ──
        bg: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          dim: "var(--color-text-dim)",
        },
        accent: {
          yellow: "var(--color-accent-yellow)",
          red: "var(--color-accent-red)",
          cyan: "var(--color-accent-cyan)",
          green: "var(--color-accent-green)",
          purple: "var(--color-accent-purple)",
        },
        faction: {
          terminid: "var(--color-terminid)",
          automaton: "var(--color-automaton)",
          illuminate: "var(--color-illuminate)",
        },
        border: {
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        // ── Backward compat aliases (recolored to new palette) ──
        helldiver: {
          yellow: "var(--color-accent-yellow)",
          red: "var(--color-accent-red)",
          orange: "var(--color-accent-yellow)", // remap eagle accent → yellow
          dark: "var(--color-bg-primary)",
          panel: "var(--color-bg-secondary)",
          steel: "var(--color-border-strong)",
          dim: "var(--color-text-dim)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "Courier New", "monospace"],
        display: ["var(--font-display)", "Rajdhani", "Impact", "sans-serif"],
      },
      spacing: {
        // Strict scale (also matches default Tailwind 1=4, 2=8, 3=12, 4=16, 5=20→override)
        "tok-1": "var(--space-1)",
        "tok-2": "var(--space-2)",
        "tok-3": "var(--space-3)",
        "tok-4": "var(--space-4)",
        "tok-5": "var(--space-5)",
        "tok-6": "var(--space-6)",
        "tok-7": "var(--space-7)",
        "tok-8": "var(--space-8)",
      },
      borderRadius: {
        "tok-sm": "var(--radius-sm)",
        "tok-md": "var(--radius-md)",
      },
      boxShadow: {
        "tok-soft": "var(--shadow-soft)",
        "tok-strong": "var(--shadow-strong)",
        "glow-yellow": "var(--glow-yellow)",
        "glow-red": "var(--glow-red)",
        "glow-cyan": "var(--glow-cyan)",
        "glow-green": "var(--glow-green)",
        "glow-purple": "var(--glow-purple)",
      },
      zIndex: {
        base: "var(--z-base)",
        ui: "var(--z-ui)",
        overlay: "var(--z-overlay)",
        alert: "var(--z-alert)",
        critical: "var(--z-critical)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      animation: {
        "scan-line": "scan 8s linear infinite",
        blink: "blink 1s steps(2) infinite",
        shake: "shake 0.4s",
        "shake-hard": "shakeHard 0.5s",
        "pulse-yellow": "pulseYellow 1.5s ease-in-out infinite",
        ticker: "ticker 60s linear infinite",
        "flash-red": "flashRed 0.5s ease-out",
        "scan-bg": "scanBg 8s linear infinite",
        "stars-slow": "starsSlow 200s linear infinite",
        "stars-fast": "starsFast 90s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        shakeHard: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-8px, -4px)" },
          "20%": { transform: "translate(8px, 4px)" },
          "30%": { transform: "translate(-6px, 4px)" },
          "40%": { transform: "translate(6px, -2px)" },
          "50%": { transform: "translate(-4px, 2px)" },
          "60%": { transform: "translate(4px, -4px)" },
          "70%": { transform: "translate(-2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "90%": { transform: "translate(-1px, 0)" },
        },
        pulseYellow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 211, 77, 0.4)" },
          "50%": { boxShadow: "0 0 24px 6px rgba(255, 211, 77, 0.7)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        flashRed: {
          "0%": { opacity: "0" },
          "30%": { opacity: "0.6" },
          "100%": { opacity: "0" },
        },
        scanBg: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100vh" },
        },
        starsSlow: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2000px)" },
        },
        starsFast: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2000px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
