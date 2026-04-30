# STATE STORES

- `combatStore.ts` — Zustand wrapper around the pure reducer. Holds combat state.
- `uiStore.ts` — UI-only state (selected card, hovered enemy, targeting mode, animation queue).
- `selectors.ts` — optimized selectors for components.
- `middleware/` — animation, sound, notification side effects triggered by events.
