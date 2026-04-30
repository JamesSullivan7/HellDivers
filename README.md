# HELLDIVERS · STRATAGEM PROTOCOL

A roguelike deckbuilder set in the Helldivers 2 universe.

🎮 **Live:** https://helldivers-cardgame.vercel.app

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Zustand** for client state
- **Framer Motion** for UI animation
- **Convex** for the live galactic war + co-op multiplayer backend
- **Web Audio API** for synthesized SFX (no audio assets required)
- **PWA-installable** (manifest + icon)

## Architecture

```
app/                # Next.js routes
components/
  shell/            # Persistent app shell (TopBar, LeftNav, BottomTicker)
  cards/            # Stratagem card system + parts
  enemies/          # EnemyCard system + parts
  boss/             # Cinematic BossFrame system
  combat/           # Combat HUD layout (Battlefield, Hand, ActionBar, Timeline)
  effects/          # Burn embers, shield ripple, enrage cinematic
game/
  events/           # CombatEvent discriminated union
  engine/           # Pure helpers (damage, shuffle, draw, difficulty)
systems/
  animation/        # Animation queue + presets
lib/                # Stores, sfx, account, cosmetics, etc.
convex/             # Server functions: war, squads, coop missions
styles/             # Design tokens
types/
```

## Running locally

```bash
npm install
npx convex dev   # connect to your own Convex deployment
npm run dev
```

Set `NEXT_PUBLIC_CONVEX_URL` in `.env.local` to your Convex deployment URL.

## Features

- 36 stratagems, 22 canonical Helldivers planets, 3 factions (Terminids / Automatons / Illuminate)
- Roguelike single-player (11-node mission, escalating difficulty 1–10, 8 sector modifiers, boss enrage at 50%)
- Live galactic war: per-planet liberation %, hourly decay cron, weekly Major Orders, real activity feed
- Squad system: callsign join codes, real-time chat with voice lines, server-authoritative co-op combat with shared reinforcements
- Meta progression: Helldiver level, 3 currencies (Medals / Samples / Requisition), Warbonds + Ship Modules + Cosmetics
- Tactical timeline (multi-turn intent visibility), cinematic boss frames, 4-channel synthesized audio with voice callouts

## License

All Helldivers IP belongs to Arrowhead Game Studios. This is a fan project.
