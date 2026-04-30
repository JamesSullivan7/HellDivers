import { create } from "zustand";
import {
  ActiveSentry,
  Card,
  CombatState,
  Faction,
  GamePhase,
  MapNode,
  PlayerState,
} from "./types";
import { getCardById, getRandomRewardCards } from "./cards";
import { instantiateEnemy, PLANETS } from "./enemies";
import { buildMissionTree } from "./missionTree";
import { rollObjectives, bumpObjective, setObjective, objectiveBonus } from "./objectives";
import { EVENTS, type EventEffect } from "./events";
import type { MissionObjective, RunBuff } from "./types";
import {
  DEFAULT_ARMOR,
  DEFAULT_BOOSTER,
  DEFAULT_WEAPON,
  FIXED_BASICS,
  getArmor,
  getArmorEffective,
  getBooster,
  getWeapon,
  getWeaponEffective,
  getBoosterPotency,
  ARMOR_PURCHASE_COST,
  WEAPON_PURCHASE_COST,
  BOOSTER_PURCHASE_COST,
  armorUpgradeCost,
  weaponUpgradeCost,
  boosterUpgradeCost,
  MAX_TIER,
  ARMORS,
  WEAPONS,
  BOOSTERS,
} from "./loadout";
import {
  Account,
  applyXp,
  calcRunReward,
  defaultAccount,
  getCardCost,
  loadAccount,
  RunRecord,
  saveAccount,
  SHIP_MODULES,
} from "./account";
import {
  claimMajorOrderIfComplete,
  contributeDefeat,
  contributeVictory,
  loadWarState,
  saveWarState,
  WarState,
} from "./galacticWar";
import { CAPES, TITLES } from "./cosmetics";
import type { CombatEvent } from "@/game/events/combatEvents";
import {
  MISSION_TYPES,
  rollMissionType,
  applyMissionBonus,
  type MissionType,
} from "./missionTypes";
import { feedback } from "@/systems/feedback/FeedbackManager";
import { useConsequence } from "./consequenceStore";
import {
  Consequence,
  CombatModifier,
} from "./consequenceTypes";
import { revealNearbyNodes } from "./missionTree";

const BASE_HAND_SIZE = 5;
const MAX_REQUISITION = 4;
const STARTING_HP = 55;
const CRIT_MULTIPLIER = 1.3;

function startingReinforcements(difficulty: number): number {
  if (difficulty <= 3) return 3;
  if (difficulty <= 6) return 2;
  if (difficulty <= 8) return 1;
  return 0; // helldive: no reinforcements
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Settings {
  muted: boolean;
  codeMinigameEnabled: boolean;
}

const SETTINGS_KEY = "helldivers_settings";
function loadSettings(): Settings {
  if (typeof window === "undefined") return { muted: false, codeMinigameEnabled: false };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { muted: false, codeMinigameEnabled: false, ...JSON.parse(raw) };
  } catch {}
  return { muted: false, codeMinigameEnabled: false };
}
function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

interface PendingPlay {
  handIndex: number;
  enemyId?: string;
  card: Card;
}

interface Loadout {
  armorId: string;
  weaponId: string;
  boosterId: string;
  stratagemIds: string[];
  /** Equipped armor's upgrade tier, 1..3. Defaults to 1 if missing. */
  armorTier?: number;
  /** Equipped weapon's upgrade tier, 1..3. */
  weaponTier?: number;
  /** Equipped booster's upgrade tier, 1..3. */
  boosterTier?: number;
}

interface GameStore {
  phase: GamePhase;
  faction: Faction;
  difficulty: number;
  modifiers: string[];
  targetPlanetId: string | null;
  squadCode: string | null;
  /** Current mission's primary objective type — codename, briefing, bonuses. */
  missionType: import("./missionTypes").MissionType;
  /** Pre-computed codename for the current mission (display only). */
  missionCodename: string;
  loadout: Loadout;
  player: PlayerState;
  ownedDeck: Card[];
  combat: CombatState;
  map: MapNode[];
  currentNodeIndex: number;
  rewardChoices: Card[];
  message: string;
  settings: Settings;
  pendingPlay: PendingPlay | null;
  handSize: number;
  account: Account;
  lastRunReward: {
    medals: number;
    xp: number;
    samples: number;
    rareSamples: number;
    superSamples: number;
    requisition: number;
  } | null;
  /** Active mission objectives (rolled at run start). */
  objectives: import("./types").MissionObjective[];
  /** Run-wide buffs from choice events. */
  runBuffs: import("./types").RunBuff[];
  /** Damage dealt this turn (tracked for the deal-damage objective). */
  damageThisTurn: number;
  /** Whether player gained any block this run (tracked for no-block objective). */
  blockUsedThisRun: boolean;
  /** Pending event id to resolve when phase === "event". */
  pendingEventId: string | null;
  /** Pending node index (set when entering a node, cleared on advance). */
  pendingNodeIndex: number | null;

  goToWar: () => void;
  goToSquadHub: () => void;
  goToSquadLobby: (code: string) => void;
  leaveSquad: () => void;
  goToLoadout: (faction: Faction, difficulty: number, modifiers: string[]) => void;
  startNewRun: (loadout: Loadout) => void;
  setDifficulty: (d: number) => void;
  enterNode: (index: number) => void;
  endTurn: () => void;
  beginPlayCard: (handIndex: number, enemyId?: string) => void;
  resolvePendingPlay: (multiplier: number) => void;
  cancelPendingPlay: () => void;
  selectCard: (handIndex: number | null) => void;
  takeReward: (card: Card | null) => void;
  takeRest: () => void;
  proceedAfterReward: () => void;
  buyShopCard: (card: Card, price: number) => void;
  buyShopHeal: (price: number, hpAmount: number) => void;
  buyShopMaxHp: (price: number, amount: number) => void;
  removeCardFromDeck: (price: number, cardId: string) => void;
  leaveShop: () => void;
  goToMenu: () => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  goToArmory: () => void;
  goToCharacter: () => void;
  goToCodex: () => void;
  unlockCard: (cardId: string) => boolean;
  unlockModule: (moduleId: string) => boolean;
  unlockCape: (id: string) => boolean;
  unlockTitle: (id: string) => boolean;
  equipCape: (id: string) => void;
  equipTitle: (id: string) => void;
  setHelldiverName: (name: string) => void;
  resetAccount: () => void;
  /** Outfitter: buy/upgrade armor/weapon/booster gear. Returns true on success. */
  buyArmor: (id: string) => boolean;
  buyWeapon: (id: string) => boolean;
  buyBooster: (id: string) => boolean;
  upgradeArmor: (id: string) => boolean;
  upgradeWeapon: (id: string) => boolean;
  upgradeBooster: (id: string) => boolean;

  /** Resolve a pending choice event with one of its choice ids. */
  resolveEventChoice: (choiceId: string) => void;

  /** Event-driven entry point. Routes a typed event to the appropriate action.
   *  Components should prefer `dispatch(event)` over calling actions directly —
   *  this is the migration path toward a fully pure reducer. */
  dispatch: (event: CombatEvent) => void;
}

function emptyCombat(): CombatState {
  return {
    enemies: [],
    deck: [],
    hand: [],
    discard: [],
    exhausted: [],
    sentries: [],
    turn: 0,
    selectedCardIndex: null,
    log: [],
  };
}

function freshPlayer(loadout?: Loadout, modules: string[] = [], difficulty: number = 3): PlayerState {
  let maxHp = STARTING_HP;
  let maxR = MAX_REQUISITION;
  let bonusReinf = 0;
  if (loadout) {
    const armor = getArmorEffective(loadout.armorId, loadout.armorTier ?? 1);
    maxHp += armor.hpMod;
    maxR += armor.reqMod;
    bonusReinf += armor.reinforcementBonus ?? 0;
    if (loadout.boosterId === "vitality_enhancement") {
      maxHp += Math.round(15 * getBoosterPotency(loadout.boosterTier ?? 1));
    }
    if (loadout.boosterId === "increased_reinforcement") {
      bonusReinf += 1;
    }
  }
  if (modules.includes("vitamin_d3")) maxHp += 20;
  if (modules.includes("hellpod_storage")) maxR += 1;
  return {
    hp: maxHp,
    maxHp,
    requisition: maxR,
    maxRequisition: maxR,
    block: 0,
    reinforcements: startingReinforcements(difficulty) + bonusReinf,
  };
}

function computeHandSize(loadout: Loadout, modules: string[] = []): number {
  const armor = getArmorEffective(loadout.armorId, loadout.armorTier ?? 1);
  let size = BASE_HAND_SIZE + armor.handMod;
  if (loadout.boosterId === "stamina_enhancement") size += 1;
  if (modules.includes("streamlined_launch")) size += 1;
  return Math.max(3, size);
}

function buildLoadoutDeck(loadout: Loadout): Card[] {
  const cards: Card[] = [];
  FIXED_BASICS.forEach((id) => cards.push(getCardById(id)));
  loadout.stratagemIds.forEach((id) => cards.push(getCardById(id)));
  // Med-Kit armor passive: extra stims in the starting deck.
  const armor = getArmorEffective(loadout.armorId, loadout.armorTier ?? 1);
  const extraStims = armor.bonusStims ?? 0;
  for (let i = 0; i < extraStims; i++) {
    cards.push(getCardById("util_stim"));
  }
  return cards;
}

const DEFAULT_LOADOUT: Loadout = {
  armorId: DEFAULT_ARMOR,
  weaponId: DEFAULT_WEAPON,
  boosterId: DEFAULT_BOOSTER,
  stratagemIds: [
    "eagle_airstrike",
    "support_recoilless",
    "sentry_mg",
    "util_resupply",
    "support_eat",
  ],
};

function drawCards(state: CombatState, count: number, log: string[]): CombatState {
  let { deck, hand, discard } = state;
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard);
      discard = [];
      log.push("> Deck reshuffled.");
    }
    const card = deck[0];
    deck = deck.slice(1);
    hand = [...hand, card];
  }
  return { ...state, deck, hand, discard };
}

export const useGame = create<GameStore>((set, get) => ({
  phase: "menu",
  faction: "terminid",
  difficulty: 3,
  modifiers: [],
  targetPlanetId: null,
  squadCode: null,
  missionType: "eliminate_target",
  missionCodename: "OPERATION IRONCLAD",
  loadout: DEFAULT_LOADOUT,
  player: freshPlayer(),
  ownedDeck: [],
  combat: emptyCombat(),
  map: [],
  currentNodeIndex: -1,
  rewardChoices: [],
  message: "",
  settings: loadSettings(),
  pendingPlay: null,
  handSize: BASE_HAND_SIZE,
  account: loadAccount(),
  lastRunReward: null,
  objectives: [],
  runBuffs: [],
  damageThisTurn: 0,
  blockUsedThisRun: false,
  pendingEventId: null,
  pendingNodeIndex: null,

  setDifficulty: (d) => set({ difficulty: d }),

  goToArmory: () => set({ phase: "armory" }),
  goToCharacter: () => set({ phase: "character" }),
  goToCodex: () => set({ phase: "codex" }),

  unlockCard: (cardId) => {
    const { account } = get();
    if (account.unlockedCards.includes(cardId)) return false;
    const card = getCardById(cardId);
    const cost = getCardCost(card.rarity);
    if (account.medals < cost) return false;
    const next: Account = {
      ...account,
      medals: account.medals - cost,
      unlockedCards: [...account.unlockedCards, cardId],
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  unlockModule: (moduleId) => {
    const { account } = get();
    if (account.unlockedModules.includes(moduleId)) return false;
    const mod = SHIP_MODULES.find((m) => m.id === moduleId);
    if (!mod) return false;
    if (account.samples < mod.cost) return false;
    const next: Account = {
      ...account,
      samples: account.samples - mod.cost,
      unlockedModules: [...account.unlockedModules, moduleId],
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  unlockCape: (id) => {
    const { account } = get();
    if (account.unlockedCapes.includes(id)) return false;
    const cape = CAPES.find((c) => c.id === id);
    if (!cape || account.requisition < cape.cost) return false;
    const next = {
      ...account,
      requisition: account.requisition - cape.cost,
      unlockedCapes: [...account.unlockedCapes, id],
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  unlockTitle: (id) => {
    const { account } = get();
    if (account.unlockedTitles.includes(id)) return false;
    const title = TITLES.find((t) => t.id === id);
    if (!title || account.requisition < title.cost) return false;
    const next = {
      ...account,
      requisition: account.requisition - title.cost,
      unlockedTitles: [...account.unlockedTitles, id],
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  equipCape: (id) => {
    const { account } = get();
    if (!account.unlockedCapes.includes(id)) return;
    const next = { ...account, equippedCape: id };
    saveAccount(next);
    set({ account: next });
  },

  equipTitle: (id) => {
    const { account } = get();
    if (!account.unlockedTitles.includes(id)) return;
    const next = { ...account, equippedTitle: id };
    saveAccount(next);
    set({ account: next });
  },

  buyArmor: (id) => {
    const { account } = get();
    if (account.ownedArmors.includes(id)) return false;
    const a = ARMORS.find((x) => x.id === id);
    if (!a) return false;
    if (account.medals < ARMOR_PURCHASE_COST) return false;
    const next: Account = {
      ...account,
      medals: account.medals - ARMOR_PURCHASE_COST,
      ownedArmors: [...account.ownedArmors, id],
      armorTiers: { ...account.armorTiers, [id]: 1 },
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  buyWeapon: (id) => {
    const { account } = get();
    if (account.ownedWeapons.includes(id)) return false;
    const w = WEAPONS.find((x) => x.id === id);
    if (!w) return false;
    if (account.medals < WEAPON_PURCHASE_COST) return false;
    const next: Account = {
      ...account,
      medals: account.medals - WEAPON_PURCHASE_COST,
      ownedWeapons: [...account.ownedWeapons, id],
      weaponTiers: { ...account.weaponTiers, [id]: 1 },
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  buyBooster: (id) => {
    const { account } = get();
    if (account.ownedBoosters.includes(id)) return false;
    const b = BOOSTERS.find((x) => x.id === id);
    if (!b) return false;
    if (account.requisition < BOOSTER_PURCHASE_COST) return false;
    const next: Account = {
      ...account,
      requisition: account.requisition - BOOSTER_PURCHASE_COST,
      ownedBoosters: [...account.ownedBoosters, id],
      boosterTiers: { ...account.boosterTiers, [id]: 1 },
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  upgradeArmor: (id) => {
    const { account } = get();
    if (!account.ownedArmors.includes(id)) return false;
    const tier = account.armorTiers[id] ?? 1;
    if (tier >= MAX_TIER) return false;
    const cost = armorUpgradeCost(tier);
    if (account.samples < cost) return false;
    const next: Account = {
      ...account,
      samples: account.samples - cost,
      armorTiers: { ...account.armorTiers, [id]: tier + 1 },
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  upgradeWeapon: (id) => {
    const { account } = get();
    if (!account.ownedWeapons.includes(id)) return false;
    const tier = account.weaponTiers[id] ?? 1;
    if (tier >= MAX_TIER) return false;
    const cost = weaponUpgradeCost(tier);
    if (account.samples < cost) return false;
    const next: Account = {
      ...account,
      samples: account.samples - cost,
      weaponTiers: { ...account.weaponTiers, [id]: tier + 1 },
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  upgradeBooster: (id) => {
    const { account } = get();
    if (!account.ownedBoosters.includes(id)) return false;
    const tier = account.boosterTiers[id] ?? 1;
    if (tier >= MAX_TIER) return false;
    const cost = boosterUpgradeCost(tier);
    if (account.samples < cost) return false;
    const next: Account = {
      ...account,
      samples: account.samples - cost,
      boosterTiers: { ...account.boosterTiers, [id]: tier + 1 },
    };
    saveAccount(next);
    set({ account: next });
    return true;
  },

  setHelldiverName: (name) => {
    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) return;
    const { account } = get();
    const next = { ...account, helldiverName: trimmed };
    saveAccount(next);
    set({ account: next });
  },

  resolveEventChoice: (choiceId) => {
    const state = get();
    const eventId = state.pendingEventId;
    if (!eventId) return;
    const event = EVENTS[eventId];
    if (!event) return;
    const choice = event.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    let player = { ...state.player };
    let ownedDeck = [...state.ownedDeck];
    let runBuffs = [...state.runBuffs];
    let account = { ...state.account };

    choice.effects.forEach((eff: EventEffect) => {
      switch (eff.kind) {
        case "noop":
          break;
        case "addCard":
          ownedDeck = [...ownedDeck, getCardById(eff.cardId)];
          break;
        case "removeOneCard":
          if (ownedDeck.length > 0) ownedDeck = ownedDeck.slice(0, -1);
          break;
        case "modifyMaxHp":
          player = {
            ...player,
            maxHp: Math.max(1, player.maxHp + eff.amount),
            hp: Math.max(1, Math.min(player.maxHp + eff.amount, player.hp + Math.min(0, eff.amount))),
          };
          break;
        case "heal":
          player = { ...player, hp: Math.min(player.maxHp, player.hp + eff.amount) };
          break;
        case "damage":
          player = { ...player, hp: Math.max(1, player.hp - eff.amount) };
          break;
        case "gainCurrency":
          account = {
            ...account,
            medals: account.medals + (eff.medals ?? 0),
            samples: account.samples + (eff.samples ?? 0),
            requisition: account.requisition + (eff.requisition ?? 0),
          };
          if (account.medals < 0) account.medals = 0;
          break;
        case "applyRunBuff":
          runBuffs = [...runBuffs, eff.buff];
          break;
        case "loseReinforcement":
          player = { ...player, reinforcements: Math.max(0, player.reinforcements - 1) };
          break;
        case "gainReinforcement":
          player = { ...player, reinforcements: player.reinforcements + 1 };
          break;
      }
    });

    saveAccount(account);

    // Mark current event node cleared and bump objective
    const map = state.map.map((n, i) =>
      i === state.currentNodeIndex ? { ...n, cleared: true } : n
    );
    let objectives = bumpObjective(state.objectives, "complete_events", 1);

    set({
      player,
      ownedDeck,
      runBuffs,
      account,
      objectives,
      map,
      pendingEventId: null,
      phase: "map",
    });
  },

  resetAccount: () => {
    const fresh = defaultAccount();
    saveAccount(fresh);
    set({ account: fresh });
  },

  /**
   * Event-driven dispatch — routes a typed event to the corresponding action.
   * This is the migration path toward a pure reducer. New components should
   * prefer `useGame((s) => s.dispatch)` and `dispatch({ type: ... })` over
   * calling individual action methods directly.
   *
   * Internally still routes to existing actions, but the event surface is
   * fixed and importable by both UI and (eventually) Convex coop functions.
   */
  dispatch: (event: CombatEvent) => {
    const s = get();
    switch (event.type) {
      case "BEGIN_PLAY_CARD":
        return s.beginPlayCard(event.handIndex, event.enemyId);
      case "PLAY_CARD":
        // For now: same as BEGIN_PLAY_CARD; pure reducer will distinguish.
        return s.beginPlayCard(event.handIndex, event.enemyId);
      case "RESOLVE_PENDING_PLAY":
        return s.resolvePendingPlay(event.multiplier);
      case "CANCEL_PENDING_PLAY":
        return s.cancelPendingPlay();
      case "SELECT_CARD":
        return s.selectCard(event.handIndex);
      case "END_TURN":
        return s.endTurn();
      case "ENTER_NODE":
        return s.enterNode(event.nodeIndex);
      case "TAKE_REWARD":
        return s.takeReward(event.card);
      case "TAKE_REST":
        return s.takeRest();
      // Atomic events not yet routed — these are placeholders for the pure
      // reducer migration. Currently the store handles them implicitly
      // inside the action methods.
      case "APPLY_DAMAGE":
      case "APPLY_BURN":
      case "STRIP_SHIELD":
      case "DRAW_CARD":
      case "GAIN_ENERGY":
      case "GAIN_BLOCK":
      case "HEAL":
      case "ENEMY_KIA":
      case "BOSS_ENRAGED":
      case "PLAYER_KIA":
        // Reserved. The pure-reducer phase will handle these.
        if (typeof console !== "undefined") {
          console.warn("[dispatch] atomic event not yet routed:", event.type);
        }
        return;
    }
  },

  setSetting: (key, value) => {
    const s = { ...get().settings, [key]: value };
    saveSettings(s);
    set({ settings: s });
  },

  goToWar: () => {
    set({ phase: "faction" });
  },

  goToSquadHub: () => set({ phase: "squad_hub" }),
  goToSquadLobby: (code) => set({ phase: "squad_lobby", squadCode: code }),
  leaveSquad: () => set({ squadCode: null, phase: "menu" }),

  goToLoadout: (faction, difficulty, modifiers) => {
    set({ phase: "loadout", faction, difficulty, modifiers });
  },

  startNewRun: (loadout) => {
    const { account, faction, modifiers, difficulty } = get();
    // Backfill equipment tiers from account so the engine sees the upgrades.
    const fullLoadout: Loadout = {
      ...loadout,
      armorTier: loadout.armorTier ?? account.armorTiers[loadout.armorId] ?? 1,
      weaponTier: loadout.weaponTier ?? account.weaponTiers[loadout.weaponId] ?? 1,
      boosterTier: loadout.boosterTier ?? account.boosterTiers[loadout.boosterId] ?? 1,
    };
    const ownedDeck = buildLoadoutDeck(fullLoadout);
    let handSize = computeHandSize(fullLoadout, account.unlockedModules);
    if (modifiers.includes("atmospheric_spores")) handSize = Math.max(3, handSize - 1);
    // Roll a mission type and apply its tree-shape weighting.
    const missionType = rollMissionType();
    const missionSpec = MISSION_TYPES[missionType];
    const missionCodename = missionSpec.codename(faction);
    const tree = buildMissionTree(faction, modifiers, missionSpec.treeWeightDelta);
    const objectives = rollObjectives(2);
    set({
      phase: "map",
      loadout: fullLoadout,
      missionType,
      missionCodename,
      player: freshPlayer(fullLoadout, account.unlockedModules, difficulty),
      ownedDeck,
      combat: emptyCombat(),
      map: tree.nodes,
      currentNodeIndex: tree.rootIndex,
      rewardChoices: [],
      message: `${missionCodename} — ${missionSpec.label}.`,
      pendingPlay: null,
      handSize,
      lastRunReward: null,
      objectives,
      runBuffs: [],
      damageThisTurn: 0,
      blockUsedThisRun: false,
      pendingEventId: null,
      pendingNodeIndex: null,
    });
  },

  enterNode: (index) => {
    const { map, ownedDeck, loadout, handSize, difficulty, modifiers, runBuffs } = get();
    const node = map[index];
    if (!node) return;

    // Tree traversal — verify the player can reach this node from current position
    const cur = get().currentNodeIndex;
    if (cur >= 0 && cur !== index) {
      const curNode = map[cur];
      if (curNode && !curNode.children.includes(index)) {
        // Not a valid traversal target — ignore.
        return;
      }
    }

    // ── Tick delayed consequences whose trigger is "next_node" / "after_nodes" ──
    {
      const consq = useConsequence.getState();
      const fired = consq.resolvePendingConsequences("next_node");
      fired.forEach((c) => applyConsequenceToGame(c, set, get));
    }

    // ── Cache: instant reward, mark cleared, return to map ──
    if (node.type === "cache") {
      const account = { ...get().account };
      const player = { ...get().player };
      const p = node.payload ?? {};
      let summary = "Loot recovered:";
      if (p.medals) {
        account.medals += p.medals;
        summary += ` +${p.medals} M`;
      }
      if (p.samples) {
        account.samples += p.samples;
        summary += ` +${p.samples} S`;
      }
      if (p.requisition) {
        account.requisition += p.requisition;
        summary += ` +${p.requisition} R`;
      }
      saveAccount(account);
      const newMap = map.map((n, i) => (i === index ? { ...n, cleared: true } : n));
      set({ account, player, map: newMap, currentNodeIndex: index, message: summary });
      feedback.reward(p.medals ?? p.samples ?? p.requisition ?? 0,
        p.medals ? "medals" : p.samples ? "samples" : "requisition");
      return;
    }

    // ── Hazard: penalty, optional run modifier, mark cleared ──
    if (node.type === "hazard") {
      const player = { ...get().player };
      const p = node.payload ?? {};
      let summary = "Hazard endured.";
      if (p.hpDelta) {
        player.hp = Math.max(1, player.hp + p.hpDelta);
        summary = `Hazard exposure: ${p.hpDelta} HP.`;
      }
      if (p.runModifierId) {
        useConsequence.getState().addRunModifier({
          id: p.runModifierId,
          name: "Vent-Burned",
          description: "+1 starting Requisition per combat for the rest of the run.",
          flavor: "neutral",
          scope: "run",
        });
        summary += " Run modifier applied.";
      }
      const newMap = map.map((n, i) => (i === index ? { ...n, cleared: true } : n));
      set({ player, map: newMap, currentNodeIndex: index, message: summary });
      return;
    }

    // ── Signal: reveal nearby nodes ──
    if (node.type === "signal") {
      const radius = node.revealRadius ?? 1;
      const revealed = revealNearbyNodes(map, index, radius);
      const newMap = revealed.map((n, i) => (i === index ? { ...n, cleared: true } : n));
      set({ map: newMap, currentNodeIndex: index, message: `Sector scan: revealed ${radius} tier${radius > 1 ? "s" : ""} ahead.` });
      return;
    }

    if (node.type === "rest") {
      set({ phase: "rest", currentNodeIndex: index, pendingNodeIndex: index });
      return;
    }

    if (node.type === "shop") {
      // Roll 3 buyable cards on entry
      const stock = getRandomRewardCards(3);
      set({
        phase: "shop",
        currentNodeIndex: index,
        pendingNodeIndex: index,
        rewardChoices: stock,
      });
      return;
    }

    if (node.type === "event") {
      set({
        phase: "event",
        pendingEventId: node.eventId ?? null,
        pendingNodeIndex: index,
        currentNodeIndex: index,
      });
      return;
    }

    // Combat / elite / boss
    const firebombHellpods = loadout.boosterId === "firebomb_hellpods";
    const firebombPotency = firebombHellpods
      ? Math.round(2 * getBoosterPotency(loadout.boosterTier ?? 1))
      : 0;

    // Resolve/consume combat modifiers FIRST so enemy instantiation can read them.
    let extraEnemyArmorDelta = 0;
    let extraEnemyBurnDelta = 0;
    let extraStartingBlock = 0;
    let extraReqBonus = 0;
    {
      const consq = useConsequence.getState();
      const fired = consq.resolvePendingConsequences("next_combat");
      fired.forEach((c) => applyConsequenceToGame(c, set, get));
      const mods = consq.consumeCombatModifiers();
      mods.forEach((m) => {
        const p = m.payload as any;
        if (typeof p.enemyArmorDelta === "number") extraEnemyArmorDelta += p.enemyArmorDelta;
        if (typeof p.enemyBurn === "number") extraEnemyBurnDelta += p.enemyBurn;
        if (typeof p.startingBlock === "number") extraStartingBlock += p.startingBlock;
        if (typeof p.reqBonus === "number") extraReqBonus += p.reqBonus;
      });
    }

    const enemies = node.enemyTemplateIds.map((id) => {
      const e = instantiateEnemy(id, difficulty);
      if (modifiers.includes("enemy_armor")) e.armor += 1;
      // Apply ambush burn from event buffs
      const ambush = runBuffs.find((b) => b.kind === "starting_burn");
      if (ambush) e.burn += ambush.amount;
      // Firebomb Hellpods booster: enemies start each combat with burn applied.
      if (firebombHellpods) e.burn += firebombPotency;
      // Consequence combat mods
      e.armor = Math.max(0, e.armor + extraEnemyArmorDelta);
      e.burn += extraEnemyBurnDelta;
      return e;
    });
    const deck = shuffle(ownedDeck);
    const armor = getArmorEffective(loadout.armorId, loadout.armorTier ?? 1);
    let startingBlock = armor.startingBlock;
    const boosterPotency = getBoosterPotency(loadout.boosterTier ?? 1);
    let reqBonus = loadout.boosterId === "hellpod_optimization"
      ? Math.round(2 * boosterPotency)
      : 0;
    // Muscle Enhancement booster: +2 starting block per combat (×potency).
    if (loadout.boosterId === "muscle_enhancement") {
      startingBlock += Math.round(2 * boosterPotency);
    }

    // Apply per-combat run buffs
    runBuffs.forEach((b) => {
      if (b.kind === "extra_starting_block") startingBlock += b.amount;
      if (b.kind === "extra_starting_r") reqBonus += b.amount;
    });

    // Apply combat-modifier-derived starting block / req bonus deltas
    if (extraStartingBlock !== 0) startingBlock += extraStartingBlock;
    if (extraReqBonus !== 0) reqBonus += extraReqBonus;

    // Apply Vent-Burned hazard modifier — +1 starting R per combat
    if (useConsequence.getState().activeRunModifiers.some((m) => m.id === "vent_burned")) {
      reqBonus += 1;
    }

    // Draw bonus from buffs
    const drawBonus = runBuffs.filter((b) => b.kind === "draw_bonus").reduce((a, b) => a + b.amount, 0);
    const effectiveHandSize = Math.max(3, handSize + drawBonus);

    const openingLog: string[] = [];
    if (node.flavor) {
      openingLog.push(`§ ${node.flavor}`);
    }
    openingLog.push(`> Node engaged.`);
    openingLog.push(`> Hostiles: ${enemies.map((e) => e.name).join(", ")}.`);

    let combat: CombatState = {
      enemies,
      deck,
      hand: [],
      discard: [],
      exhausted: [],
      sentries: [],
      turn: 1,
      selectedCardIndex: null,
      log: openingLog,
    };
    const log = [...combat.log];
    combat = drawCards(combat, effectiveHandSize, log);
    combat.log = log;

    // Expire next_combat buffs
    const remainingBuffs = runBuffs.filter((b) => b.lifetime !== "next_combat");

    set((s) => ({
      phase: "combat",
      currentNodeIndex: index,
      pendingNodeIndex: index,
      combat,
      pendingPlay: null,
      runBuffs: remainingBuffs,
      damageThisTurn: 0,
      player: {
        ...s.player,
        requisition: Math.max(0, s.player.maxRequisition + reqBonus),
        block: startingBlock,
      },
    }));
  },

  selectCard: (handIndex) => {
    set((s) => ({ combat: { ...s.combat, selectedCardIndex: handIndex } }));
  },

  beginPlayCard: (handIndex, enemyId) => {
    const state = get();
    const { combat, player, settings, modifiers } = state;
    const card = combat.hand[handIndex];
    if (!card) return;
    let actualCost = card.cost;
    if (modifiers.includes("increased_air_sec") && card.type === "eagle") actualCost += 1;
    if (player.requisition < actualCost) return;
    if (settings.codeMinigameEnabled) {
      set({ pendingPlay: { handIndex, enemyId, card } });
    } else {
      executePlay(set, get, handIndex, enemyId, 1);
    }
  },

  resolvePendingPlay: (multiplier: number) => {
    const state = get();
    const pending = state.pendingPlay;
    if (!pending) return;
    set({ pendingPlay: null });
    executePlay(set, get, pending.handIndex, pending.enemyId, multiplier);
  },

  cancelPendingPlay: () => set({ pendingPlay: null }),

  endTurn: () => {
    const state = get();
    let { combat, player } = state;
    const { loadout, handSize, modifiers: runMods } = state;
    let enemies = combat.enemies.map((e) => ({ ...e }));
    let log = [...combat.log];
    let newPlayer = { ...player };
    const weapon = getWeaponEffective(loadout.weaponId, loadout.weaponTier ?? 1);

    log.push(`> End of turn ${combat.turn}.`);

    // Sector modifier: Acidic Atmosphere — 1 dmg/turn (bypasses block)
    if (runMods.includes("acidic_atmosphere")) {
      newPlayer.hp = Math.max(0, newPlayer.hp - 1);
      log.push(`  [Acidic Atmosphere] -1 HP.`);
    }

    // Boss enrage check (run BEFORE enemy actions so they use enraged pattern)
    enemies = enemies.map((e) => {
      if (e.isBoss && !e.enraged && e.hp > 0 && e.hp <= e.maxHp / 2 && e.enragedPattern) {
        log.push(`> ⚠ ${e.enragedMessage ?? `${e.name} ENRAGED.`}`);
        feedback.bossEnrage(e.name);
        return {
          ...e,
          enraged: true,
          intents: e.enragedPattern,
          intentIndex: 0,
        };
      }
      return e;
    });

    // Primary weapon passive fire
    {
      const alive = () => enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.hp > 0);
      const fireOnce = (idx: number) => {
        const enemy = enemies[idx];
        if (!enemy || enemy.hp <= 0) return;
        let dmg = weapon.damage;
        let shield = enemy.shield;
        let hp = enemy.hp;
        if (shield > 0) {
          const absorbed = Math.min(shield, dmg);
          shield -= absorbed;
          dmg -= absorbed;
        }
        if (dmg > 0) {
          const after = weapon.ignoreArmor ? dmg : Math.max(0, dmg - enemy.armor);
          hp = Math.max(0, hp - after);
        }
        enemies[idx] = { ...enemy, hp, shield };
      };
      for (let h = 0; h < weapon.hitsPerTurn; h++) {
        const a = alive();
        if (a.length === 0) break;
        if (weapon.target === "all") {
          a.forEach(({ i }) => fireOnce(i));
          break;
        } else if (weapon.target === "highest_hp") {
          a.sort((x, y) => y.e.hp - x.e.hp);
          fireOnce(a[0].i);
        } else {
          fireOnce(a[Math.floor(Math.random() * a.length)].i);
        }
      }
      log.push(`  [${weapon.name}] fires.`);
    }

    // sentry effects — each active sentry fires once per turn
    const remainingSentries: ActiveSentry[] = [];
    combat.sentries.forEach((s, sentryIdx) => {
      if (s.turnsLeft <= 0) return;
      const alive = enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.hp > 0);
      let didFire = false;
      if (alive.length > 0) {
        didFire = true;
        if (s.targetAll) {
          alive.forEach(({ e, i }) => {
            const dmg = applyShieldThenArmor(e, s.damage, false, 0);
            enemies[i] = dmg.enemy;
          });
          log.push(`  [${s.name}] hits all for ${s.damage}.`);
        } else {
          const pick = alive[Math.floor(Math.random() * alive.length)];
          const dmg = applyShieldThenArmor(pick.e, s.damage, false, 0);
          enemies[pick.i] = dmg.enemy;
          log.push(`  [${s.name}] hits ${pick.e.name} for ${dmg.dealt}.`);
        }
      }
      // Visual + audio "ACTIVATING" feedback — flies the sentry's source card
      // back to the center stage so the player sees what's doing damage.
      // Stagger by ~120ms between sentries to avoid stacking.
      if (didFire) {
        try {
          const card = getCardById(s.cardId);
          window.setTimeout(
            () => feedback.cardTick(s.cardId, s.name, card.type),
            sentryIdx * 120,
          );
        } catch {
          /* card lookup failed — skip the visual, log line still shown */
        }
      }
      remainingSentries.push({ ...s, turnsLeft: s.turnsLeft - 1 });
    });

    // burn ticks (bypasses shield)
    enemies = enemies.map((e) => {
      if (e.hp <= 0) return e;
      if (e.burn > 0) {
        const newHp = Math.max(0, e.hp - e.burn);
        log.push(`  ${e.name} burns for ${e.burn} (-> ${newHp} HP).`);
        return { ...e, hp: newHp, burn: Math.max(0, e.burn - 1) };
      }
      return e;
    });

    const allDeadAfterTick = enemies.every((e) => e.hp <= 0);
    if (allDeadAfterTick) {
      log.push(`> Hostiles cleared.`);
      const node = state.map[state.currentNodeIndex];
      const isBoss = node.type === "boss";
      if (!isBoss) {
        feedback.objectiveComplete("Hostiles Cleared", 0);
      }
      const newCombat: CombatState = {
        ...combat,
        enemies,
        sentries: remainingSentries.filter((s) => s.turnsLeft > 0),
        log,
      };
      if (isBoss) {
        set({ combat: newCombat });
        finalizeRun(set, get, true);
      }
      else {
        const choices = getRandomRewardCards(3);
        set({ combat: newCombat, phase: "reward", rewardChoices: choices });
      }
      return;
    }

    // Localization Confusion booster — skip first N enemy turns (N = tier)
    const localizationActive =
      loadout.boosterId === "localization_confusion" &&
      combat.turn <= (loadout.boosterTier ?? 1);
    if (localizationActive) {
      log.push(`  [Localization Confusion] enemies disoriented, skipping action.`);
    }

    // enemy actions
    enemies.forEach((e, idx) => {
      if (e.hp <= 0) return;
      if (localizationActive) {
        enemies[idx] = { ...enemies[idx], intentIndex: e.intentIndex + 1 };
        return;
      }
      const intent = e.intents[e.intentIndex % e.intents.length];
      switch (intent.kind) {
        case "attack":
        case "attack_all": {
          const dmg = intent.damage ?? 0;
          let remaining = dmg;
          if (newPlayer.block > 0) {
            const absorbed = Math.min(newPlayer.block, remaining);
            newPlayer.block -= absorbed;
            remaining -= absorbed;
            if (absorbed > 0)
              log.push(`  ${e.name} attacks (Block absorbs ${absorbed}).`);
          }
          if (remaining > 0) {
            newPlayer.hp = Math.max(0, newPlayer.hp - remaining);
            log.push(`  ${e.name} hits for ${remaining}.`);
            feedback.enemyAttack(remaining, e.name);
          }
          break;
        }
        case "buff": {
          // Illuminate enemies regen shield, others gain armor
          if (e.faction === "illuminate" && intent.text.toLowerCase().includes("shield")) {
            const amt = parseInt(intent.text.match(/\+(\d+)/)?.[1] ?? "3", 10);
            enemies[idx] = { ...enemies[idx], shield: enemies[idx].shield + amt };
            log.push(`  ${e.name} reinforces shield (+${amt}).`);
          } else {
            const amt = parseInt(intent.text.match(/\+(\d+)/)?.[1] ?? "1", 10);
            enemies[idx] = { ...enemies[idx], armor: enemies[idx].armor + amt };
            log.push(`  ${e.name} hardens (Armor +${amt}).`);
          }
          break;
        }
        case "wait": {
          log.push(`  ${e.name}: ${intent.text}`);
          break;
        }
        case "armor": {
          enemies[idx] = { ...enemies[idx], armor: enemies[idx].armor + 2 };
          log.push(`  ${e.name} (Armor +2).`);
          break;
        }
      }
      enemies[idx] = { ...enemies[idx], intentIndex: e.intentIndex + 1 };
    });

    if (newPlayer.hp <= 0) {
      if (newPlayer.reinforcements > 0) {
        newPlayer.reinforcements -= 1;
        newPlayer.hp = Math.floor(newPlayer.maxHp * 0.6);
        log.push(`> REINFORCEMENT DEPLOYED. (${newPlayer.reinforcements} left)`);
      } else {
        log.push(`> Helldiver KIA. Mission failed.`);
        set({
          combat: { ...combat, enemies, log, sentries: remainingSentries },
          player: newPlayer,
        });
        finalizeRun(set, get, false);
        return;
      }
    }

    let newCombat: CombatState = {
      ...combat,
      enemies,
      sentries: remainingSentries.filter((s) => s.turnsLeft > 0),
      turn: combat.turn + 1,
      log,
    };
    newCombat = {
      ...newCombat,
      discard: [...newCombat.discard, ...newCombat.hand],
      hand: [],
    };
    newCombat = drawCards(newCombat, handSize, log);
    newCombat.log = log;

    newPlayer.requisition = newPlayer.maxRequisition;
    newPlayer.block = 0;

    set({ combat: newCombat, player: newPlayer, damageThisTurn: 0 });
  },

  takeReward: (card) => {
    const state = get();
    const ownedDeck = card ? [...state.ownedDeck, card] : state.ownedDeck;
    set({ ownedDeck, rewardChoices: [], phase: "map" });
  },

  takeRest: () => {
    const state = get();
    const heal = Math.floor(state.player.maxHp * 0.4);
    const newHp = Math.min(state.player.maxHp, state.player.hp + heal);
    const map = state.map.map((n, i) =>
      i === state.currentNodeIndex ? { ...n, cleared: true } : n
    );
    set({
      player: { ...state.player, hp: newHp },
      map,
      phase: "map",
      message: `Rest stop. Recovered ${heal} HP.`,
    });
  },

  proceedAfterReward: () => {
    const state = get();
    const map = state.map.map((n, i) =>
      i === state.currentNodeIndex ? { ...n, cleared: true } : n
    );
    set({ map, phase: "map" });
  },

  buyShopCard: (card, price) => {
    const state = get();
    if (state.account.medals < price) return;
    const account = {
      ...state.account,
      medals: state.account.medals - price,
    };
    saveAccount(account);
    const ownedDeck = [...state.ownedDeck, card];
    // Remove the bought card from the stock
    const rewardChoices = state.rewardChoices.filter((c) => c !== card);
    set({ account, ownedDeck, rewardChoices });
  },

  buyShopHeal: (price, hpAmount) => {
    const state = get();
    if (state.account.medals < price) return;
    const account = {
      ...state.account,
      medals: state.account.medals - price,
    };
    saveAccount(account);
    const player = {
      ...state.player,
      hp: Math.min(state.player.maxHp, state.player.hp + hpAmount),
    };
    set({ account, player });
  },

  buyShopMaxHp: (price, amount) => {
    const state = get();
    if (state.account.medals < price) return;
    const account = {
      ...state.account,
      medals: state.account.medals - price,
    };
    saveAccount(account);
    const player = {
      ...state.player,
      maxHp: state.player.maxHp + amount,
      hp: state.player.hp + amount,
    };
    set({ account, player });
  },

  removeCardFromDeck: (price, cardId) => {
    const state = get();
    if (state.account.medals < price) return;
    const account = {
      ...state.account,
      medals: state.account.medals - price,
    };
    saveAccount(account);
    // Remove first matching card
    const idx = state.ownedDeck.findIndex((c) => c.id === cardId);
    if (idx < 0) return;
    const ownedDeck = [...state.ownedDeck.slice(0, idx), ...state.ownedDeck.slice(idx + 1)];
    set({ account, ownedDeck });
  },

  leaveShop: () => {
    const state = get();
    const map = state.map.map((n, i) =>
      i === state.currentNodeIndex ? { ...n, cleared: true } : n
    );
    set({ map, rewardChoices: [], phase: "map" });
  },

  goToMenu: () => {
    set({
      phase: "menu",
      player: freshPlayer(),
      ownedDeck: [],
      combat: emptyCombat(),
      map: [],
      currentNodeIndex: -1,
      rewardChoices: [],
      message: "",
      pendingPlay: null,
    });
  },
}));

export const CRIT_BONUS = CRIT_MULTIPLIER;

// Export a non-method play resolver for the minigame
export function executePlayDirect(handIndex: number, enemyId?: string, multiplier = 1) {
  executePlay(useGame.setState, useGame.getState, handIndex, enemyId, multiplier);
}

// Helper: damage with shield-then-armor priority
function applyShieldThenArmor(
  enemy: import("./types").Enemy,
  baseDmg: number,
  ignoreArmor: boolean,
  bonusVsArmor: number
): { enemy: import("./types").Enemy; dealt: number } {
  let dmg = baseDmg;
  if (enemy.armor > 0 && bonusVsArmor) dmg += bonusVsArmor;
  // shield absorbs first
  let shield = enemy.shield;
  let hp = enemy.hp;
  let dealt = 0;
  if (shield > 0) {
    const absorbed = Math.min(shield, dmg);
    shield -= absorbed;
    dmg -= absorbed;
  }
  if (dmg > 0) {
    const afterArmor = ignoreArmor ? dmg : Math.max(0, dmg - enemy.armor);
    hp = Math.max(0, hp - afterArmor);
    dealt = afterArmor;
  }
  return { enemy: { ...enemy, hp, shield }, dealt };
}

function executePlay(
  set: (partial: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore,
  handIndex: number,
  enemyId: string | undefined,
  multiplier: number
) {
  const state = get();
  const { combat, player, account, modifiers: runMods } = state;
  const card = combat.hand[handIndex];
  if (!card) return;

  // Sector modifier: Increased Air Security raises Eagle cost
  let actualCost = card.cost;
  if (runMods.includes("increased_air_sec") && card.type === "eagle") actualCost += 1;
  if (player.requisition < actualCost) return;

  let log = [...combat.log];
  let enemies = combat.enemies.map((e) => ({ ...e }));
  let newPlayer = { ...player, requisition: player.requisition - actualCost };
  let sentries = [...combat.sentries];
  let extraDraws = 0;

  // Module bonuses
  const mods = account.unlockedModules;
  let damageBonus = 0;
  if (card.type === "eagle" && mods.includes("eagle_storm")) damageBonus += 1;
  if (card.type === "orbital" && mods.includes("orbital_targeting")) damageBonus += 1;
  if (card.type === "support" && mods.includes("plasma_cutters")) damageBonus += 1;
  if (mods.includes("ammunition_priming")) multiplier *= 1.05;
  // Sector modifier: Magnetic Storm reduces orbital damage by 30%
  if (runMods.includes("magnetic_storm") && card.type === "orbital") multiplier *= 0.7;
  // Low Visibility: 15% miss for single-target
  if (runMods.includes("low_visibility") && card.target === "single") {
    if (Math.random() < 0.15) {
      log.push(`> ${card.name} called in. ✕ MISS — Low visibility.`);
      let hand = [...combat.hand];
      hand.splice(handIndex, 1);
      const discardArr = [...combat.discard, card];
      set({
        combat: {
          ...combat,
          hand,
          discard: discardArr,
          selectedCardIndex: null,
          log,
        },
        player: newPlayer,
      });
      return;
    }
  }

  if (multiplier > 1) {
    log.push(`> ${card.name} called in. ✓ CRIT (+${Math.round((multiplier - 1) * 100)}%)`);
  } else {
    log.push(`> ${card.name} called in.`);
  }

  const eff = card.effect;
  const m = (n: number) => Math.round(n * multiplier);
  const md = (n: number) => Math.round(n * multiplier) + (n > 0 ? damageBonus : 0);

  if (eff.heal) {
    const h = m(eff.heal);
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + h);
    log.push(`  Healed ${h} HP.`);
  }
  if (eff.block) {
    newPlayer.block += m(eff.block);
    log.push(`  Gained ${m(eff.block)} Block.`);
    // Track for "no_block_used" objective
    set((s) => ({ blockUsedThisRun: true }));
  }
  if (eff.gainRequisition) {
    newPlayer.requisition += eff.gainRequisition;
    log.push(`  +${eff.gainRequisition} R.`);
  }
  if (eff.draw) {
    extraDraws = eff.draw;
  }

  const aliveIndices = () => enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.hp > 0);

  let totalDmgThisCard = 0;

  const dealTo = (idx: number, base: number) => {
    const enemy = enemies[idx];
    if (!enemy || enemy.hp <= 0) return;
    const result = applyShieldThenArmor(enemy, base, !!eff.ignoreArmor, eff.bonusVsArmor ?? 0);
    enemies[idx] = result.enemy;
    const shieldedFor = enemy.shield - enemies[idx].shield;
    totalDmgThisCard += result.dealt;
    if (shieldedFor > 0 && result.dealt === 0) {
      log.push(`  ${enemy.name}: shield -${shieldedFor}.`);
    } else if (shieldedFor > 0) {
      log.push(`  ${enemy.name}: shield -${shieldedFor}, HP -${result.dealt}.`);
    } else {
      log.push(`  ${enemy.name}: -${result.dealt} (${enemies[idx].hp}/${enemy.maxHp}).`);
    }
  };

  const stripShieldFrom = (idx: number, amt: number) => {
    const enemy = enemies[idx];
    if (!enemy || enemy.shield <= 0) return;
    const stripped = Math.min(enemy.shield, amt);
    enemies[idx] = { ...enemy, shield: enemy.shield - stripped };
    log.push(`  ${enemy.name}: shield stripped ${stripped}.`);
  };

  if (eff.stripShield) {
    const amt = m(eff.stripShield);
    switch (card.target) {
      case "single": {
        const idx = enemies.findIndex((e) => e.id === enemyId);
        if (idx >= 0) stripShieldFrom(idx, amt);
        break;
      }
      case "all": {
        aliveIndices().forEach(({ i }) => stripShieldFrom(i, amt));
        break;
      }
      default:
        break;
    }
  }

  if (eff.damage !== undefined) {
    const baseDmg = md(eff.damage);
    const hits = eff.damageHits ?? 1;
    switch (card.target) {
      case "single": {
        const target = enemies.findIndex((e) => e.id === enemyId);
        if (target >= 0) {
          for (let h = 0; h < hits; h++) {
            if (eff.chain && h === 0) {
              const order = aliveIndices().map((x) => x.i);
              const ordered = [target, ...order.filter((i) => i !== target)].slice(0, eff.chain);
              ordered.forEach((idx) => {
                if (eff.stripShield) stripShieldFrom(idx, m(eff.stripShield));
                dealTo(idx, baseDmg);
              });
            } else {
              dealTo(target, baseDmg);
            }
          }
        }
        break;
      }
      case "all": {
        for (let h = 0; h < hits; h++) {
          aliveIndices().forEach(({ i }) => dealTo(i, baseDmg));
        }
        break;
      }
      case "random": {
        for (let h = 0; h < hits; h++) {
          const alive = aliveIndices();
          if (alive.length === 0) break;
          const pick = alive[Math.floor(Math.random() * alive.length)];
          dealTo(pick.i, baseDmg);
        }
        break;
      }
      case "highest_hp": {
        const alive = aliveIndices();
        if (alive.length > 0) {
          alive.sort((a, b) => b.e.hp - a.e.hp);
          for (let h = 0; h < hits; h++) dealTo(alive[0].i, baseDmg);
        }
        break;
      }
      case "self":
        break;
    }
  }

  if (eff.burn) {
    const b = m(eff.burn);
    switch (card.target) {
      case "single": {
        const idx = enemies.findIndex((e) => e.id === enemyId);
        if (idx >= 0 && enemies[idx].hp > 0) {
          enemies[idx] = { ...enemies[idx], burn: enemies[idx].burn + b };
          log.push(`  ${enemies[idx].name}: +${b} Burn.`);
        }
        break;
      }
      case "all": {
        aliveIndices().forEach(({ i }) => {
          enemies[i] = { ...enemies[i], burn: enemies[i].burn + b };
        });
        log.push(`  Burn applied to all (${b}).`);
        break;
      }
      default:
        break;
    }
  }

  if (eff.recurringDamage) {
    const sentryBonus = mods.includes("sentry_calibration") && card.type === "sentry" ? 1 : 0;
    const newSentry: ActiveSentry = {
      id: `sentry_${Math.random().toString(36).slice(2, 8)}`,
      cardId: card.id,
      name: card.name,
      damage: m(eff.recurringDamage.amount) + sentryBonus,
      turnsLeft: eff.recurringDamage.turns,
      targetAll: eff.recurringDamage.targetAll ?? false,
    };
    sentries.push(newSentry);
    log.push(
      `  ${card.name} deployed (${newSentry.turnsLeft}t, ${newSentry.targetAll ? "AoE" : "single"} ${newSentry.damage} dmg).`
    );
  }

  if (eff.selfDamage) {
    newPlayer.hp = Math.max(0, newPlayer.hp - eff.selfDamage);
    log.push(`  Took ${eff.selfDamage} self damage.`);
  }

  let hand = [...combat.hand];
  hand.splice(handIndex, 1);
  let discard = [...combat.discard];
  let exhausted = [...combat.exhausted];
  if (eff.exhaust) exhausted.push(card);
  else discard.push(card);

  enemies.forEach((e) => { if (e.hp <= 0 && combat.enemies.find(o => o.id === e.id && o.hp > 0)) log.push(`> ${e.name} eliminated.`); });

  let newCombat: CombatState = {
    ...combat,
    enemies,
    hand,
    discard,
    exhausted,
    sentries,
    selectedCardIndex: null,
    log,
  };

  if (extraDraws > 0) {
    newCombat = drawCards(newCombat, extraDraws, log);
  }

  // Update damage-this-turn objective tracker
  const newDmgThisTurn = state.damageThisTurn + totalDmgThisCard;
  let updatedObjectives = setObjective(state.objectives, "deal_damage_in_turn", newDmgThisTurn);

  const allDead = enemies.every((e) => e.hp <= 0);
  if (allDead) {
    log.push(`> Hostiles cleared. Stand by for extraction.`);
    newCombat = { ...newCombat, log };
    const node = state.map[state.currentNodeIndex];
    const isBoss = node.type === "boss";

    if (!isBoss) {
      feedback.objectiveComplete("Hostiles Cleared", 0);
    }

    // Bump elite-kills objective if this was an elite node
    if (node.type === "elite") {
      updatedObjectives = bumpObjective(updatedObjectives, "kill_elites", 1);
    }

    if (isBoss) {
      // Capture turn count + final HP for objectives
      const turnsTaken = newCombat.turn;
      updatedObjectives = setObjective(updatedObjectives, "win_in_turns", -turnsTaken + 100);
      // win_in_turns: target is "≤6 turns" → progress = 100 - turnsTaken; complete if progress ≥ (100 - target)
      // Simpler: directly mark complete if turns ≤ target
      updatedObjectives = updatedObjectives.map((o) =>
        o.kind === "win_in_turns" && !o.completed && turnsTaken <= o.target
          ? { ...o, progress: o.target, completed: true }
          : o
      );
      const hpPct = (newPlayer.hp / newPlayer.maxHp) * 100;
      updatedObjectives = updatedObjectives.map((o) =>
        o.kind === "high_hp_finish" && !o.completed && hpPct >= o.target
          ? { ...o, progress: hpPct, completed: true }
          : o
      );
      // no_exhaust: completed if no exhausted cards in current combat
      updatedObjectives = updatedObjectives.map((o) =>
        o.kind === "no_exhaust" && !o.completed && newCombat.exhausted.length === 0
          ? { ...o, progress: 1, completed: true }
          : o
      );
      // no_block_used: completed if blockUsedThisRun is false
      updatedObjectives = updatedObjectives.map((o) =>
        o.kind === "no_block_used" && !o.completed && !state.blockUsedThisRun
          ? { ...o, progress: 1, completed: true }
          : o
      );

      set({ combat: newCombat, player: newPlayer, objectives: updatedObjectives, damageThisTurn: newDmgThisTurn });
      finalizeRun(set, get, true);
    } else {
      // dem_skip / free_card buff: skip the next reward draft, consume the buff,
      // and proceed straight to map (marking the node cleared).
      const skipBuff = state.runBuffs.find((b) => b.kind === "free_card");
      if (skipBuff) {
        const remainingBuffs = state.runBuffs.filter((b) => b.id !== skipBuff.id);
        const map = state.map.map((n, i) =>
          i === state.currentNodeIndex ? { ...n, cleared: true } : n
        );
        set({
          combat: newCombat,
          player: newPlayer,
          objectives: updatedObjectives,
          damageThisTurn: newDmgThisTurn,
          runBuffs: remainingBuffs,
          map,
          phase: "map",
          message: "Inspection compliant — reward draft waived.",
        });
      } else {
        const choices = getRandomRewardCards(3);
        set({
          combat: newCombat,
          player: newPlayer,
          objectives: updatedObjectives,
          damageThisTurn: newDmgThisTurn,
          phase: "reward",
          rewardChoices: choices,
        });
      }
    }
    return;
  }

  set({
    combat: newCombat,
    player: newPlayer,
    objectives: updatedObjectives,
    damageThisTurn: newDmgThisTurn,
  });
}

function finalizeRun(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
  victory: boolean
) {
  const state = get();
  const nodesCleared = victory
    ? state.map.length
    : state.map.filter((n) => n.cleared).length;
  const baseReward = calcRunReward({
    victory,
    nodesCleared,
    faction: state.faction,
    difficulty: state.difficulty,
  });
  const objBonus = objectiveBonus(state.objectives);
  // Apply mission-type bonus on top of base rewards (medals / sample multipliers).
  const withMission = applyMissionBonus(
    {
      medals: baseReward.medals + objBonus,
      samples: baseReward.samples,
      rareSamples: baseReward.rareSamples,
      superSamples: baseReward.superSamples,
    },
    state.missionType,
    victory
  );
  const reward = {
    ...baseReward,
    medals: withMission.medals,
    samples: withMission.samples,
    rareSamples: withMission.rareSamples,
    superSamples: withMission.superSamples,
  };
  const updatedAcc1 = applyXp(state.account, reward.xp);
  const planet = PLANETS[state.faction];
  const record: RunRecord = {
    date: Date.now(),
    faction: state.faction,
    planet: planet.name,
    outcome: victory ? "victory" : "defeat",
    nodesCleared,
    medalsEarned: reward.medals,
    xpEarned: reward.xp,
    difficulty: state.difficulty,
  };
  const updatedAcc: Account = {
    ...updatedAcc1,
    medals: updatedAcc1.medals + reward.medals,
    samples: updatedAcc1.samples + reward.samples,
    rareSamples: updatedAcc1.rareSamples + reward.rareSamples,
    superSamples: updatedAcc1.superSamples + reward.superSamples,
    requisition: updatedAcc1.requisition + reward.requisition,
    totalRuns: updatedAcc1.totalRuns + 1,
    victories: updatedAcc1.victories + (victory ? 1 : 0),
    history: [record, ...updatedAcc1.history].slice(0, 20),
  };
  saveAccount(updatedAcc);

  // Contribute to (solo) galactic war state
  let majorOrderBonus = 0;
  if (state.targetPlanetId) {
    let war = loadWarState();
    war = victory
      ? contributeVictory(war, state.targetPlanetId, state.difficulty)
      : contributeDefeat(war, state.targetPlanetId, state.difficulty);
    // If this victory completed the active Major Order, claim its medal
    // payout and roll a fresh order. Idempotent if order is incomplete.
    const claim = claimMajorOrderIfComplete(war);
    war = claim.state;
    majorOrderBonus = claim.medalsAwarded;
    saveWarState(war);
  }

  let finalAccount = updatedAcc;
  if (majorOrderBonus > 0) {
    finalAccount = {
      ...updatedAcc,
      medals: updatedAcc.medals + majorOrderBonus,
    };
    saveAccount(finalAccount);
  }

  set({
    account: finalAccount,
    lastRunReward: majorOrderBonus > 0
      ? { ...reward, medals: reward.medals + majorOrderBonus }
      : reward,
    phase: victory ? "victory" : "gameover",
  });

  // Reset consequence state — fresh slate next run
  useConsequence.getState().clearAll();

  // Game-feel feedback for the run resolution
  if (victory) feedback.victory();
  else feedback.defeat();
}

// ──────────────────────────────────────────────────────────────────────
//  CONSEQUENCE → GAME STATE BRIDGE
//  The consequence store holds data; this function applies it to the
//  game store. Called from enterNode tick + EventScreen choice flow.
// ──────────────────────────────────────────────────────────────────────
export function applyConsequenceToGame(
  c: Consequence,
  set: any,
  get: any,
): void {
  const consq = useConsequence.getState();

  switch (c.type) {
    case "immediate":
    case "resource": {
      // Direct write into game state — payload describes deltas.
      const p = c.payload as {
        medals?: number;
        samples?: number;
        rareSamples?: number;
        superSamples?: number;
        requisition?: number;
        hpDelta?: number;
      };
      const acc = { ...get().account };
      const player = { ...get().player };
      if (p.medals) acc.medals += p.medals;
      if (p.samples) acc.samples += p.samples;
      if (p.rareSamples) acc.rareSamples += p.rareSamples;
      if (p.superSamples) acc.superSamples += p.superSamples;
      if (p.requisition) acc.requisition += p.requisition;
      if (p.hpDelta) player.hp = Math.max(1, Math.min(player.maxHp, player.hp + p.hpDelta));
      saveAccount(acc);
      set({ account: acc, player });
      break;
    }
    case "run_modifier": {
      const p = c.payload as {
        modifierId: string;
        name: string;
        description: string;
        flavor?: "positive" | "neutral" | "negative";
        scope?: "run" | "next_combat";
      };
      consq.addRunModifier({
        id: p.modifierId,
        name: p.name,
        description: p.description,
        flavor: p.flavor ?? "neutral",
        scope: p.scope ?? "run",
      });
      break;
    }
    case "narrative_flag": {
      const p = c.payload as { flag: string };
      if (p.flag) consq.addNarrativeFlag(p.flag);
      break;
    }
    case "combat_modifier": {
      // Stash for the next combat to consume.
      consq.pushPendingCombatMod({
        id: c.id,
        payload: c.payload,
        displayText: c.displayText,
        consumeAfterCombat: true,
      });
      break;
    }
    case "map_modifier": {
      const state = get();
      const p = c.payload as {
        kind: "reveal_radius" | "lock_path" | "convert_node" | "mark_danger";
        fromIndex?: number;
        radius?: number;
        targetIndex?: number;
        toType?: import("./types").NodeType;
      };
      if (p.kind === "reveal_radius") {
        const from = p.fromIndex ?? state.currentNodeIndex;
        const newMap = revealNearbyNodes(state.map, from, p.radius ?? 2);
        set({ map: newMap });
      } else if (p.kind === "convert_node" && p.targetIndex !== undefined && p.toType) {
        const newMap = state.map.map((n: import("./types").MapNode, i: number) =>
          i === p.targetIndex ? { ...n, type: p.toType! } : n
        );
        set({ map: newMap });
      }
      // lock_path / mark_danger left for future expansion
      break;
    }
    case "delayed":
      // Should never be applied directly — delayed consequences are queued and ticked.
      // Treat as a passthrough noop.
      break;
  }

  // Toast for the player so they see what just happened.
  feedback.choiceSelect(c.displayText);
  consq.appendResolvedToLastHistory(c.displayText);
}
