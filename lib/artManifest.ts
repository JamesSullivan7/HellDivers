/**
 * Art manifest — central mapping from game IDs to public image paths.
 *
 * Files live in /public/art/ — Next.js serves them from "/art/...".
 * Returns null when there is no art for that ID so callers can fall back
 * to their existing icon/silhouette placeholder cleanly.
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
  impaler: `${ART_BASE}/enemies/impaler.png`,
  dragonroach: `${ART_BASE}/enemies/dragonroach.png`,
  bile_spewer: `${ART_BASE}/enemies/bile_spewer.png`,
  brood_commander: `${ART_BASE}/enemies/brood_commander.png`,
  // Automatons
  trooper: `${ART_BASE}/enemies/trooper.png`,
  devastator: `${ART_BASE}/enemies/devastator.png`,
  hulk: `${ART_BASE}/enemies/hulk.png`,
  berserker: `${ART_BASE}/enemies/berserker.png`,
  factory_strider: `${ART_BASE}/enemies/factory_strider.png`,
  tank: `${ART_BASE}/enemies/annihilator_tank.png`,
  scout_strider: `${ART_BASE}/enemies/scout_strider.png`,
  // Illuminate
  voteless: `${ART_BASE}/enemies/voteless.png`,
  watcher: `${ART_BASE}/enemies/watcher.png`,
  overseer: `${ART_BASE}/enemies/overseer.png`,
  harvester: `${ART_BASE}/enemies/harvester.png`,
  leviathan: `${ART_BASE}/enemies/leviathan.png`,
};

export function getEnemyArt(templateId: string): string | null {
  return ENEMY_ART[templateId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// STRATAGEM CARDS — maps card id → image path
// ──────────────────────────────────────────────────────────────────────
const CARD_ART: Record<string, string> = {
  // ── ORBITAL ──
  orbital_railcannon: `${ART_BASE}/stratagems/orbital_railcannon_strike.png`,
  orbital_380mm: `${ART_BASE}/stratagems/orbital_380mm_he_barrage.png`,
  orbital_laser: `${ART_BASE}/stratagems/orbital_laser.png`,
  orbital_emp: `${ART_BASE}/stratagems/orbital_ems_strike.png`,
  orbital_napalm: `${ART_BASE}/stratagems/orbital_napalm_barrage.png`,
  orbital_smoke: `${ART_BASE}/stratagems/orbital_smoke_strike.png`,
  orbital_at_mines: `${ART_BASE}/stratagems/md17_anti_tank_mines.png`,
  orbital_precision: `${ART_BASE}/stratagems/orbital_precision.png`,
  orbital_gatling: `${ART_BASE}/stratagems/orbital_gatling.png`,
  orbital_gas: `${ART_BASE}/stratagems/orbital_gas.png`,
  orbital_walking: `${ART_BASE}/stratagems/orbital_walking_barrage.png`,

  // ── EAGLE ──
  eagle_airstrike: `${ART_BASE}/stratagems/eagle_airstrike.png`,
  eagle_cluster: `${ART_BASE}/stratagems/eagle_cluster_bomb.png`,
  eagle_500kg: `${ART_BASE}/stratagems/eagle_500kg_bomb.png`,
  eagle_napalm: `${ART_BASE}/stratagems/eagle_napalm_airstrike.png`,
  eagle_smoke: `${ART_BASE}/stratagems/eagle_smoke_strike.png`,
  eagle_strafe: `${ART_BASE}/stratagems/eagle_strafing_run.png`,
  eagle_rocket: `${ART_BASE}/stratagems/eagle_110mm_rocket_pods.png`,
  eagle_ap_mines: `${ART_BASE}/stratagems/md6_anti_personnel_minefield.png`,
  eagle_incendiary_mines: `${ART_BASE}/stratagems/md14_incendiary_mines.png`,

  // ── SENTRIES ──
  sentry_mg: `${ART_BASE}/stratagems/g16_gatling_sentry.png`,
  sentry_autocannon: `${ART_BASE}/stratagems/ac8_autocannon_sentry.png`,
  sentry_mortar: `${ART_BASE}/stratagems/m12_mortar_sentry.png`,
  sentry_tesla: `${ART_BASE}/stratagems/arc3_tesla_tower.png`,
  sentry_rocket: `${ART_BASE}/stratagems/mls4x_rocket_sentry.png`,
  sentry_ems: `${ART_BASE}/stratagems/m23_ems_mortar_sentry.png`,
  sentry_laser: `${ART_BASE}/stratagems/las98_laser_sentry.png`,
  sentry_flame: `${ART_BASE}/stratagems/flam40_flame_sentry.png`,
  sentry_gas_mortar: `${ART_BASE}/stratagems/gm17_gas_mortar_sentry.png`,
  sentry_at_emplacement: `${ART_BASE}/stratagems/at12_anti_tank_emplacement.png`,
  sentry_hmg_emplacement: `${ART_BASE}/stratagems/emg101_hmg_emplacement.png`,
  sentry_grenadier: `${ART_BASE}/stratagems/gl21_grenadier_battlement.png`,
  sentry_shield_relay: `${ART_BASE}/stratagems/fx12_shield_generator_relay.png`,

  // ── SUPPORT WEAPONS ──
  support_recoilless: `${ART_BASE}/stratagems/recoilless_rifle.png`,
  support_amr: `${ART_BASE}/stratagems/anti_materiel_rifle.png`,
  support_stalwart: `${ART_BASE}/stratagems/stalwart.png`,
  support_flamer: `${ART_BASE}/stratagems/flamethrower.png`,
  support_arc: `${ART_BASE}/stratagems/arc_thrower.png`,
  support_eat: `${ART_BASE}/stratagems/expendable_anti_tank.png`,
  support_rg: `${ART_BASE}/stratagems/railgun.png`,
  support_grenade: `${ART_BASE}/stratagems/grenade_launcher.png`,
  support_autocannon: `${ART_BASE}/stratagems/autocannon.png`,
  support_machine_gun: `${ART_BASE}/stratagems/machine_gun.png`,
  support_hmg: `${ART_BASE}/stratagems/heavy_machine_gun.png`,
  support_laser_cannon: `${ART_BASE}/stratagems/laser_cannon.png`,
  support_airburst: `${ART_BASE}/stratagems/airburst_rocket_launcher.png`,
  support_breaching_hammer: `${ART_BASE}/stratagems/breaching_hammer.png`,
  support_exosuit: `${ART_BASE}/stratagems/exo55_breakthrough_exosuit.png`,
  support_quasar: `${ART_BASE}/stratagems/quasar_cannon.png`,
  support_spear: `${ART_BASE}/stratagems/spear.png`,
  support_hellbomb: `${ART_BASE}/stratagems/hellbomb.png`,

  // ── BACKPACKS / UTILITY ──
  util_shield: `${ART_BASE}/stratagems/sh32_shield_generator_pack.png`,
  util_ballistic_shield: `${ART_BASE}/stratagems/sh20_ballistic_shield_backpack.png`,
  util_supply_pack: `${ART_BASE}/stratagems/b1_supply_pack.png`,
  util_guard_dog: `${ART_BASE}/stratagems/ar23_guard_dog.png`,
  util_las_rover: `${ART_BASE}/stratagems/las5_rover.png`,
  util_jump_pack: `${ART_BASE}/stratagems/lift850_jump_pack.png`,
  util_resupply: `${ART_BASE}/stratagems/resupply.png`,
  util_reinforce: `${ART_BASE}/stratagems/reinforce.png`,
  util_shield_relay: `${ART_BASE}/stratagems/fx12_shield_generator_relay.png`,
  // util_stim — no dedicated art.
};

export function getCardArt(cardId: string): string | null {
  return CARD_ART[cardId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// MISC
// ──────────────────────────────────────────────────────────────────────
export const HELLDIVER_PORTRAIT = `${ART_BASE}/misc/helldiver_portrait.png`;
