import type { Faction, RunBuff } from "./types";
import type { EncounterType, EncounterIntensity } from "./encounterTheme";

export type EventEffect =
  | { kind: "noop" }
  | { kind: "addCard"; cardId: string }
  | { kind: "removeOneCard"; }
  | { kind: "modifyMaxHp"; amount: number }
  | { kind: "heal"; amount: number }
  | { kind: "damage"; amount: number }
  | { kind: "gainCurrency"; medals?: number; samples?: number; requisition?: number }
  | { kind: "applyRunBuff"; buff: RunBuff }
  | { kind: "loseReinforcement" }
  | { kind: "gainReinforcement" };

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
  /** Multiple effects can be chained per choice. */
  effects: EventEffect[];
}

export interface ChoiceEvent {
  id: string;
  title: string;
  flavor: string;
  choices: ChoiceOption[];
  /**
   * Optional faction affinity. If set, this event is preferred when the
   * current run's faction matches. Universal events (no faction) are eligible
   * everywhere.
   */
  faction?: Faction;
  /**
   * Encounter mood — drives backdrop overlay, scanlines, type label/icon.
   * Defaults to "civilian" if missing.
   */
  type?: EncounterType;
  /**
   * Drama level — drives particle density, glow strength, flicker amplitude.
   * Defaults to "medium" if missing.
   */
  intensity?: EncounterIntensity;
}

export const EVENTS: Record<string, ChoiceEvent> = {
  civilian_truck: {
    id: "civilian_truck",
    type: "civilian",
    intensity: "medium",
    title: "Civilian Convoy",
    flavor:
      "A line of overloaded transport trucks rolls toward your position. Faces in the windows. They're trying to flag you down.",
    choices: [
      {
        id: "escort",
        label: "Escort to Safety",
        description: "Detour adds drag to next combat (-1 R), but Super Earth pays out.",
        effects: [
          { kind: "gainCurrency", medals: 80 },
          {
            kind: "applyRunBuff",
            buff: {
              id: "escort_drag",
              name: "Escort Detour",
              description: "-1 R in next combat.",
              lifetime: "next_combat",
              kind: "extra_starting_r",
              amount: -1,
            },
          },
        ],
      },
      {
        id: "wave_off",
        label: "Wave Them Off",
        description: "No effect. They'll figure it out.",
        effects: [{ kind: "noop" }],
      },
      {
        id: "salvage",
        label: "Salvage the Lead Truck",
        description: "Find a Resupply card. Civilians lose faith.",
        effects: [
          { kind: "addCard", cardId: "util_resupply" },
        ],
      },
    ],
  },

  eagle_pilot_down: {
    id: "eagle_pilot_down",
    type: "civilian",
    intensity: "medium",
    title: "Eagle-1 Pilot Crash",
    faction: "automaton",
    flavor:
      "Smoke trails over the ridge. An Eagle-1 stratosphere fighter has gone down. The pilot is broadcasting an SOS over open comms.",
    choices: [
      {
        id: "rescue",
        label: "Rescue the Pilot",
        description:
          "Earn a free Eagle Airstrike for the run. Take 8 damage from automaton patrol on the way back.",
        effects: [
          { kind: "addCard", cardId: "eagle_airstrike" },
          { kind: "damage", amount: 8 },
        ],
      },
      {
        id: "ignore",
        label: "Continue Mission",
        description: "Gain 1 reinforcement. War is hell.",
        effects: [{ kind: "gainReinforcement" }],
      },
    ],
  },

  stratagem_cache: {
    id: "stratagem_cache",
    type: "reward",
    intensity: "low",
    title: "Stratagem Cache",
    faction: "automaton",
    flavor:
      "An abandoned automaton supply crate hisses with cooling vents. Inside: an unfamiliar stratagem terminal still drawing power.",
    choices: [
      {
        id: "hack",
        label: "Hack the Terminal",
        description: "Random rare stratagem added to your deck.",
        effects: [{ kind: "addCard", cardId: "support_hellbomb" }],
      },
      {
        id: "destroy",
        label: "Demolish It",
        description: "Deny the enemy. Gain 30 medals.",
        effects: [{ kind: "gainCurrency", medals: 30 }],
      },
      {
        id: "leave",
        label: "Mark and Move",
        description: "Note the location. Leave it for command. (No effect)",
        effects: [{ kind: "noop" }],
      },
    ],
  },

  acidic_vent: {
    id: "acidic_vent",
    type: "hazard",
    intensity: "medium",
    title: "Acidic Vent",
    faction: "terminid",
    flavor:
      "A geothermal acid vent splits the path. The bug pheromone trail crosses it directly. There's a slow detour around.",
    choices: [
      {
        id: "brave",
        label: "Brave the Vent",
        description: "-10 max HP. +1 starting R every combat for the run.",
        effects: [
          { kind: "modifyMaxHp", amount: -10 },
          {
            kind: "applyRunBuff",
            buff: {
              id: "vent_burn",
              name: "Vent-Burned",
              description: "+1 starting R per combat.",
              lifetime: "run",
              kind: "extra_starting_r",
              amount: 1,
            },
          },
        ],
      },
      {
        id: "detour",
        label: "Take the Detour",
        description: "Lose nothing, gain nothing. (Time costs medals.)",
        effects: [{ kind: "gainCurrency", medals: -10 }],
      },
    ],
  },

  dem_officer: {
    id: "dem_officer",
    type: "command",
    intensity: "medium",
    title: "Democracy Officer Inspection",
    flavor:
      "Boots crunch behind you. A Democracy Officer in mirror-polish armor wants a word. He has a clipboard.",
    choices: [
      {
        id: "submit",
        label: "Submit to Inspection",
        description: "Skip your next reward draft. Gain 200 medals + 50 requisition.",
        effects: [
          { kind: "gainCurrency", medals: 200, requisition: 50 },
          {
            kind: "applyRunBuff",
            buff: {
              id: "dem_skip",
              name: "Inspection Compliant",
              description: "Skip the next reward draft.",
              lifetime: "run",
              kind: "free_card", // marker; reward screen reads this buff to skip
              amount: 0,
            },
          },
        ],
      },
      {
        id: "refuse",
        label: "Refuse",
        description: "Patriotism intact. Take 5 damage from a 'random' debris hit later.",
        effects: [{ kind: "damage", amount: 5 }],
      },
    ],
  },

  stim_cache: {
    id: "stim_cache",
    type: "reward",
    intensity: "low",
    title: "Hellpod Stim Cache",
    flavor:
      "A jettisoned hellpod, cracked open, contents scattered. Stim packs glitter in the dirt.",
    choices: [
      {
        id: "heal",
        label: "Use Them All",
        description: "Heal 25 HP.",
        effects: [{ kind: "heal", amount: 25 }],
      },
      {
        id: "stockpile",
        label: "Stockpile",
        description: "Add a Stim card to your deck.",
        effects: [{ kind: "addCard", cardId: "util_stim" }],
      },
    ],
  },

  sos_beacon: {
    id: "sos_beacon",
    type: "civilian",
    intensity: "medium",
    title: "Squad SOS Beacon",
    flavor:
      "A pulsing red beacon nearby. Another squad pinned down. Helldivers leave no Helldivers behind. (Probably.)",
    choices: [
      {
        id: "rescue",
        label: "Rescue Mission",
        description: "Take 12 damage. Gain Reinforce + a free reinforcement.",
        effects: [
          { kind: "damage", amount: 12 },
          { kind: "addCard", cardId: "util_reinforce" },
          { kind: "gainReinforcement" },
        ],
      },
      {
        id: "report",
        label: "Report Their Position",
        description: "Gain 60 medals. They'll understand.",
        effects: [{ kind: "gainCurrency", medals: 60 }],
      },
    ],
  },

  patrol_warning: {
    id: "patrol_warning",
    type: "combat",
    intensity: "medium",
    title: "Patrol Sighted",
    flavor:
      "Footprints in the dust. A patrol moved through here recently. Big one.",
    choices: [
      {
        id: "ambush",
        label: "Set an Ambush",
        description: "Next combat: enemies start with 6 burn applied.",
        effects: [
          {
            kind: "applyRunBuff",
            buff: {
              id: "ambush_burn",
              name: "Ambush Set",
              description: "Next combat enemies start with 6 burn.",
              lifetime: "next_combat",
              kind: "starting_burn",
              amount: 6,
            },
          },
        ],
      },
      {
        id: "evade",
        label: "Evade the Patrol",
        description: "Avoid contact. Gain 1 reinforcement. (Cost: cowardice.)",
        effects: [{ kind: "gainReinforcement" }],
      },
    ],
  },

  // ───── TERMINID-FLAVORED EVENTS ─────

  spore_field: {
    id: "spore_field",
    faction: "terminid",
    type: "hazard",
    intensity: "high",
    title: "Bioluminescent Spore Field",
    flavor:
      "Glowing spores drift between the trees. Sweet, choking, possibly hallucinogenic. The path through saves time.",
    choices: [
      {
        id: "push_through",
        label: "Push Through",
        description: "Take 6 damage. +2 max HP for the run (your immune system adapts).",
        effects: [
          { kind: "damage", amount: 6 },
          { kind: "modifyMaxHp", amount: 2 },
        ],
      },
      {
        id: "incinerate",
        label: "Incinerate the Field",
        description: "Next combat: all enemies start with 4 burn.",
        effects: [
          {
            kind: "applyRunBuff",
            buff: {
              id: "incinerate_field",
              name: "Burning Approach",
              description: "Next combat enemies start with 4 burn.",
              lifetime: "next_combat",
              kind: "starting_burn",
              amount: 4,
            },
          },
        ],
      },
    ],
  },

  bug_breach: {
    id: "bug_breach",
    faction: "terminid",
    type: "combat",
    intensity: "high",
    title: "Bug Breach Warning",
    flavor:
      "A pheromone signal pulses underground. The bugs know you're here. They're calling reinforcements.",
    choices: [
      {
        id: "preempt",
        label: "Strike First",
        description: "Add an Orbital Precision Strike for the run. Lose 1 reinforcement.",
        effects: [
          { kind: "addCard", cardId: "orbital_precision" },
          { kind: "loseReinforcement" },
        ],
      },
      {
        id: "fortify",
        label: "Fortify Position",
        description: "Next combat: +12 starting block.",
        effects: [
          {
            kind: "applyRunBuff",
            buff: {
              id: "bug_fortify",
              name: "Fortified Position",
              description: "+12 starting block next combat.",
              lifetime: "next_combat",
              kind: "extra_starting_block",
              amount: 12,
            },
          },
        ],
      },
      {
        id: "panic",
        label: "Run for It",
        description: "Lose 5 HP from the sprint. Gain 40 medals (filed under \"tactical retreat\").",
        effects: [
          { kind: "damage", amount: 5 },
          { kind: "gainCurrency", medals: 40 },
        ],
      },
    ],
  },

  bug_carcass: {
    id: "bug_carcass",
    faction: "terminid",
    type: "reward",
    intensity: "medium",
    title: "Bile Titan Carcass",
    flavor:
      "Half-buried in the dirt. Glistening rare samples in the wound cavity. The smell is unspeakable.",
    choices: [
      {
        id: "harvest",
        label: "Harvest Samples",
        description: "Gain 4 samples. Take 4 damage from acid burns.",
        effects: [
          { kind: "gainCurrency", samples: 4 },
          { kind: "damage", amount: 4 },
        ],
      },
      {
        id: "torch",
        label: "Torch It",
        description: "Deny the biomass. Gain 50 medals from Super Earth.",
        effects: [{ kind: "gainCurrency", medals: 50 }],
      },
    ],
  },

  // ───── AUTOMATON-FLAVORED EVENTS ─────

  derelict_factory: {
    id: "derelict_factory",
    faction: "automaton",
    type: "reward",
    intensity: "low",
    title: "Derelict Fabricator",
    flavor:
      "An automaton fabricator stands cold and silent. Most of the systems are still warm. One terminal blinks orange.",
    choices: [
      {
        id: "scrap",
        label: "Strip Components",
        description: "Gain 30 requisition. The fabricator self-destructs as you leave.",
        effects: [
          { kind: "gainCurrency", requisition: 30 },
          { kind: "damage", amount: 4 },
        ],
      },
      {
        id: "reprogram",
        label: "Reprogram It",
        description: "Add Resupply Pack to your deck. Risk: +1 R cost next combat.",
        effects: [
          { kind: "addCard", cardId: "util_supply_pack" },
          {
            kind: "applyRunBuff",
            buff: {
              id: "fabricator_drag",
              name: "Reprogrammer's Tax",
              description: "-1 R next combat.",
              lifetime: "next_combat",
              kind: "extra_starting_r",
              amount: -1,
            },
          },
        ],
      },
      {
        id: "demolish",
        label: "Demolish It",
        description: "Deny the enemy. Gain 60 medals.",
        effects: [{ kind: "gainCurrency", medals: 60 }],
      },
    ],
  },

  scrap_dealer: {
    id: "scrap_dealer",
    faction: "automaton",
    type: "civilian",
    intensity: "low",
    title: "Scrap Dealer",
    flavor:
      "A grizzled Helldiver veteran in salvaged armor offers a trade. \"Don't ask where I got it, diver.\"",
    choices: [
      {
        id: "buy_armor",
        label: "Buy Plating (60 R)",
        description: "Gain 14 max HP for the run. Costs 60 requisition.",
        effects: [
          { kind: "gainCurrency", requisition: -60 },
          { kind: "modifyMaxHp", amount: 14 },
        ],
      },
      {
        id: "trade_card",
        label: "Trade a Stratagem",
        description: "Drop a random stratagem from your deck for a free Eagle Strafing Run.",
        effects: [
          { kind: "removeOneCard" },
          { kind: "addCard", cardId: "eagle_strafe" },
        ],
      },
      {
        id: "wave_off",
        label: "Wave Him Off",
        description: "He shrugs. \"Suit yourself.\"",
        effects: [{ kind: "noop" }],
      },
    ],
  },

  jammer_tower: {
    id: "jammer_tower",
    faction: "automaton",
    type: "hazard",
    intensity: "high",
    title: "Stratagem Jammer Tower",
    flavor:
      "A tower humming on the ridgeline. While it's up, your stratagems are unreliable. While it's up, the bots are blind to your hellpods.",
    choices: [
      {
        id: "destroy",
        label: "Demolition Run",
        description: "Take 8 damage. Next combat: enemies have 0 armor.",
        effects: [
          { kind: "damage", amount: 8 },
          {
            kind: "applyRunBuff",
            buff: {
              id: "jammer_down",
              name: "Jammer Down",
              description: "Enemies have weakened armor next combat.",
              lifetime: "next_combat",
              kind: "weapon_dmg_delta",
              amount: 2,
            },
          },
        ],
      },
      {
        id: "ignore",
        label: "Avoid It",
        description: "No effect. Stay below the radar.",
        effects: [{ kind: "noop" }],
      },
    ],
  },

  // ───── ILLUMINATE-FLAVORED EVENTS ─────

  void_rift: {
    id: "void_rift",
    faction: "illuminate",
    type: "risk",
    intensity: "high",
    title: "Void Rift",
    flavor:
      "A shimmering tear in space hangs over the path. Whispers in a language nobody admits to understanding.",
    choices: [
      {
        id: "step_through",
        label: "Step Through",
        description: "Gain a free random stratagem. Take 10 damage from psychic feedback.",
        effects: [
          { kind: "addCard", cardId: "support_hellbomb" },
          { kind: "damage", amount: 10 },
        ],
      },
      {
        id: "study",
        label: "Document the Phenomenon",
        description: "Gain 3 samples. Super Earth Science Division thanks you.",
        effects: [{ kind: "gainCurrency", samples: 3 }],
      },
      {
        id: "back_away",
        label: "Back Away",
        description: "Some things are not meant to be touched. (No effect.)",
        effects: [{ kind: "noop" }],
      },
    ],
  },

  obelisk_resonance: {
    id: "obelisk_resonance",
    faction: "illuminate",
    type: "risk",
    intensity: "medium",
    title: "Resonating Obelisk",
    flavor:
      "A black obelisk hums in synchrony with your heartbeat. Touching it feels inevitable.",
    choices: [
      {
        id: "attune",
        label: "Attune to the Obelisk",
        description: "+1 starting R for every combat the rest of the run. Lose 8 max HP.",
        effects: [
          { kind: "modifyMaxHp", amount: -8 },
          {
            kind: "applyRunBuff",
            buff: {
              id: "obelisk_attune",
              name: "Obelisk-Attuned",
              description: "+1 starting R per combat.",
              lifetime: "run",
              kind: "extra_starting_r",
              amount: 1,
            },
          },
        ],
      },
      {
        id: "shatter",
        label: "Shatter It",
        description: "Take 12 damage from the backlash. Gain 100 medals.",
        effects: [
          { kind: "damage", amount: 12 },
          { kind: "gainCurrency", medals: 100 },
        ],
      },
    ],
  },

  voteless_shrine: {
    id: "voteless_shrine",
    faction: "illuminate",
    type: "risk",
    intensity: "low",
    title: "Voteless Shrine",
    flavor:
      "A circle of Voteless surround a low altar. None of them have moved in hours. They are smiling.",
    choices: [
      {
        id: "burn_shrine",
        label: "Burn the Shrine",
        description: "Heal 15 HP. Patriotism rewarded.",
        effects: [{ kind: "heal", amount: 15 }],
      },
      {
        id: "study_shrine",
        label: "Study the Ritual",
        description: "Gain 2 samples. The Voteless slowly turn to watch you.",
        effects: [
          { kind: "gainCurrency", samples: 2 },
          {
            kind: "applyRunBuff",
            buff: {
              id: "watched",
              name: "Watched",
              description: "Next combat: enemies start with 4 burn (their ritual).",
              lifetime: "next_combat",
              kind: "starting_burn",
              amount: 4,
            },
          },
        ],
      },
    ],
  },
};

export function getEvent(id: string): ChoiceEvent | undefined {
  return EVENTS[id];
}
