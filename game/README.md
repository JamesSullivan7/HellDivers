# GAME LOGIC LAYER

**This layer is headless. No React. No DOM. No side effects in pure functions.**

Pure functions only. Imported by both client store (`lib/store.ts`) and Convex
coop functions (`convex/coop.ts`). Single source of truth for combat math.

## Files

### `events/combatEvents.ts`
Discriminated union of every meaningful combat state change. The contract
between UI and game logic. Components dispatch these via `useGame((s) => s.dispatch)`.

### `engine/pure.ts`
Pure utilities used by both client and server:
- `mulberry32(seed)` — deterministic RNG for testable seeded combat
- `shuffle(arr, rand)` — deck shuffle
- `computeDamage(enemy, baseDmg, opts)` — shield → armor priority math
- `computePlayerDamage(player, amount)` — block absorption
- `shouldEnrage(enemy)` — boss enrage threshold check (≤50% HP)
- `drawCards(piles, count, rand)` — draw with auto-reshuffle
- `difficultyScale(d)` — HP/dmg scaling (1.0 → 2.55 across D1–10)

### `engine/index.ts`
Public API barrel. Imports go through here:
```ts
import { computeDamage, shuffle, drawCards, type CombatEvent } from "@/game/engine";
```

## Architecture status

**Today (Phase 9):**
- Event types defined ✓
- Pure helpers extracted ✓
- `dispatch(event)` API on store ✓
- High-level events routed to existing actions ✓
- Atomic events reserved for the pure-reducer phase

**Future (Phase 9.5):**
- Implement a true `combatReducer(state, event)` that handles atomic events
  inline, replacing the imperative logic currently in `lib/store.ts`
- Convex `convex/coop.ts` imports the same reducer for server-authoritative coop
- Animation middleware observes state changes and pushes to the queue

The `dispatch()` API surface is stable now — when the reducer arrives, the
public API stays identical, only the internals change.
