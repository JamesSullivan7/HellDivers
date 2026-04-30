/**
 * Art manifest — central mapping from game IDs to public image paths.
 *
 * Files live in /public/art/ — Next.js serves them from "/art/...".
 * Returns null when there is no art for that ID so callers can fall back
 * to their existing icon/silhouette placeholder cleanly.
 *
 * Heads up: these mappings are intentionally hand-curated. Image filenames
 * don't always match game IDs (e.g. eagle_strafing_run.png ↔ eagle_strafe).
 */

const ART_BASE = "/art";

// ──────────────────────────────────────────────────────────────────────
// ENEMIES — maps enemy template id → portrait path
// ──────────────────────────────────────────────────────────────────────
const ENEMY_ART: Record<string, string> = {
  // Terminids
  scavenger: `${ART_BASE}/enemies/scavenger.png`,
  hunter: `${ART_BASE}/enemies/hunter.png`,
  warrior: `${ART_BASE}/enemies/warrior.png`,
  charger: `${ART_BASE}/enemies/charger.png`,
  stalker: `${ART_BASE}/enemies/stalker.png`,
  bile_titan: `${ART_BASE}/enemies/bile_titan.png`,
  // Automatons
  trooper: `${ART_BASE}/enemies/trooper.png`,
  devastator: `${ART_BASE}/enemies/devastator.png`,
  hulk: `${ART_BASE}/enemies/hulk.png`,
  factory_strider: `${ART_BASE}/enemies/factory_strider.png`,
  // Illuminate
  voteless: `${ART_BASE}/enemies/voteless.png`,
  watcher: `${ART_BASE}/enemies/watcher.png`,
  overseer: `${ART_BASE}/enemies/overseer.png`,
  harvester: `${ART_BASE}/enemies/harvester.png`,
};

/**
 * Extra portraits we have art for that aren't yet used as enemy templates.
 * Listed here so they're discoverable later when we add HD2 canon enemies.
 *
 *   annihilator_tank, dragonroach, impaler, leviathan, scout_strider
 */

export function getEnemyArt(templateId: string): string | null {
  return ENEMY_ART[templateId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// STRATAGEM CARDS — maps card id → image path
// ──────────────────────────────────────────────────────────────────────
const CARD_ART: Record<string, string> = {
  // Orbital
  orbital_railcannon: `${ART_BASE}/stratagems/orbital_railcannon_strike.png`,
  orbital_380mm: `${ART_BASE}/stratagems/orbital_380mm_he_barrage.png`,
  orbital_laser: `${ART_BASE}/stratagems/orbital_laser.png`,
  orbital_emp: `${ART_BASE}/stratagems/orbital_ems_strike.png`,
  // Approximate matches — closest available art for cards without dedicated images:
  orbital_walking: `${ART_BASE}/stratagems/orbital_napalm_barrage.png`,
  orbital_gas: `${ART_BASE}/stratagems/orbital_napalm_barrage.png`,
  orbital_precision: `${ART_BASE}/stratagems/orbital_smoke_strike.png`,
  // Eagle
  eagle_airstrike: `${ART_BASE}/stratagems/eagle_airstrike.png`,
  eagle_cluster: `${ART_BASE}/stratagems/eagle_cluster_bomb.png`,
  eagle_500kg: `${ART_BASE}/stratagems/eagle_500kg_bomb.png`,
  eagle_napalm: `${ART_BASE}/stratagems/eagle_napalm_airstrike.png`,
  eagle_smoke: `${ART_BASE}/stratagems/eagle_smoke_strike.png`,
  eagle_strafe: `${ART_BASE}/stratagems/eagle_strafing_run.png`,
  eagle_rocket: `${ART_BASE}/stratagems/eagle_110mm_rocket_pods.png`,
  // Sentries
  sentry_mg: `${ART_BASE}/stratagems/g16_gatling_sentry.png`,
  sentry_autocannon: `${ART_BASE}/stratagems/ac8_autocannon_sentry.png`,
  sentry_mortar: `${ART_BASE}/stratagems/m12_mortar_sentry.png`,
  sentry_tesla: `${ART_BASE}/stratagems/arc3_tesla_tower.png`,
  sentry_rocket: `${ART_BASE}/stratagems/mls4x_rocket_sentry.png`,
  sentry_ems: `${ART_BASE}/stratagems/m23_ems_mortar_sentry.png`,
  // Support weapons
  support_recoilless: `${ART_BASE}/stratagems/recoilless_rifle.png`,
  support_amr: `${ART_BASE}/stratagems/anti_materiel_rifle.png`,
  support_stalwart: `${ART_BASE}/stratagems/stalwart.png`,
  support_flamer: `${ART_BASE}/stratagems/flamethrower.png`,
  support_arc: `${ART_BASE}/stratagems/arc_thrower.png`,
  support_eat: `${ART_BASE}/stratagems/expendable_anti_tank.png`,
  support_rg: `${ART_BASE}/stratagems/railgun.png`,
  support_grenade: `${ART_BASE}/stratagems/grenade_launcher.png`,
  // Approximate matches:
  support_quasar: `${ART_BASE}/stratagems/laser_cannon.png`,
  support_spear: `${ART_BASE}/stratagems/airburst_rocket_launcher.png`,
  support_hellbomb: `${ART_BASE}/stratagems/at12_anti_tank_emplacement.png`,
  // Backpacks / utility
  util_shield: `${ART_BASE}/stratagems/sh32_shield_generator_pack.png`,
  util_ballistic_shield: `${ART_BASE}/stratagems/sh20_ballistic_shield_backpack.png`,
  util_supply_pack: `${ART_BASE}/stratagems/b1_supply_pack.png`,
  // util_resupply / util_stim / util_reinforce — no dedicated art yet, fall back to icon.
};

/**
 * Bonus stratagem art available but not yet wired to a card. Pulling from
 * HD2 canon — these would slot into future stratagem expansions:
 *
 *   ar23_guard_dog, ar23_guard_dog_alt, las5_rover, lift850_jump_pack,
 *   exo55_breakthrough_exosuit, breaching_hammer, autocannon, machine_gun,
 *   heavy_machine_gun, las98_laser_sentry, flam40_flame_sentry,
 *   gm17_gas_mortar_sentry, gl21_grenadier_battlement, emg101_hmg_emplacement,
 *   md6_anti_personnel_minefield, md14_incendiary_mines, md17_anti_tank_mines,
 *   fx12_shield_generator_relay
 */

export function getCardArt(cardId: string): string | null {
  return CARD_ART[cardId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// MISC — Helldiver portrait used for character UI
// ──────────────────────────────────────────────────────────────────────
export const HELLDIVER_PORTRAIT = `${ART_BASE}/misc/helldiver_portrait.png`;
