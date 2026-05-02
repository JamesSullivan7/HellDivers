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
  scavenger: `${ART_BASE}/enemies/scavenger.jpg`,
  hunter: `${ART_BASE}/enemies/hunter.jpg`,
  warrior: `${ART_BASE}/enemies/warrior.jpg`,
  charger: `${ART_BASE}/enemies/charger.jpg`,
  stalker: `${ART_BASE}/enemies/stalker.jpg`,
  bile_titan: `${ART_BASE}/enemies/bile_titan.jpg`,
  impaler: `${ART_BASE}/enemies/impaler.jpg`,
  dragonroach: `${ART_BASE}/enemies/dragonroach.jpg`,
  bile_spewer: `${ART_BASE}/enemies/bile_spewer.jpg`,
  brood_commander: `${ART_BASE}/enemies/brood_commander.jpg`,
  // Automatons
  trooper: `${ART_BASE}/enemies/trooper.jpg`,
  devastator: `${ART_BASE}/enemies/devastator.jpg`,
  hulk: `${ART_BASE}/enemies/hulk.jpg`,
  berserker: `${ART_BASE}/enemies/berserker.jpg`,
  factory_strider: `${ART_BASE}/enemies/factory_strider.jpg`,
  tank: `${ART_BASE}/enemies/annihilator_tank.jpg`,
  scout_strider: `${ART_BASE}/enemies/scout_strider.jpg`,
  // Illuminate
  voteless: `${ART_BASE}/enemies/voteless.jpg`,
  watcher: `${ART_BASE}/enemies/watcher.jpg`,
  overseer: `${ART_BASE}/enemies/overseer.jpg`,
  harvester: `${ART_BASE}/enemies/harvester.jpg`,
  leviathan: `${ART_BASE}/enemies/leviathan.jpg`,
};

export function getEnemyArt(templateId: string): string | null {
  return ENEMY_ART[templateId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// STRATAGEM CARDS — maps card id → image path
// ──────────────────────────────────────────────────────────────────────
const CARD_ART: Record<string, string> = {
  // ── ORBITAL ──
  orbital_railcannon: `${ART_BASE}/stratagems/orbital_railcannon_strike.jpg`,
  orbital_380mm: `${ART_BASE}/stratagems/orbital_380mm_he_barrage.jpg`,
  orbital_laser: `${ART_BASE}/stratagems/orbital_laser.jpg`,
  orbital_emp: `${ART_BASE}/stratagems/orbital_ems_strike.jpg`,
  orbital_napalm: `${ART_BASE}/stratagems/orbital_napalm_barrage.jpg`,
  orbital_smoke: `${ART_BASE}/stratagems/orbital_smoke_strike.jpg`,
  orbital_at_mines: `${ART_BASE}/stratagems/md17_anti_tank_mines.jpg`,
  orbital_precision: `${ART_BASE}/stratagems/orbital_precision.jpg`,
  orbital_gatling: `${ART_BASE}/stratagems/orbital_gatling.jpg`,
  orbital_gas: `${ART_BASE}/stratagems/orbital_gas.jpg`,
  orbital_walking: `${ART_BASE}/stratagems/orbital_walking_barrage.jpg`,

  // ── EAGLE ──
  eagle_airstrike: `${ART_BASE}/stratagems/eagle_airstrike.jpg`,
  eagle_cluster: `${ART_BASE}/stratagems/eagle_cluster_bomb.jpg`,
  eagle_500kg: `${ART_BASE}/stratagems/eagle_500kg_bomb.jpg`,
  eagle_napalm: `${ART_BASE}/stratagems/eagle_napalm_airstrike.jpg`,
  eagle_smoke: `${ART_BASE}/stratagems/eagle_smoke_strike.jpg`,
  eagle_strafe: `${ART_BASE}/stratagems/eagle_strafing_run.jpg`,
  eagle_rocket: `${ART_BASE}/stratagems/eagle_110mm_rocket_pods.jpg`,
  eagle_ap_mines: `${ART_BASE}/stratagems/md6_anti_personnel_minefield.jpg`,
  eagle_incendiary_mines: `${ART_BASE}/stratagems/md14_incendiary_mines.jpg`,

  // ── SENTRIES ──
  sentry_mg: `${ART_BASE}/stratagems/g16_gatling_sentry.jpg`,
  sentry_autocannon: `${ART_BASE}/stratagems/ac8_autocannon_sentry.jpg`,
  sentry_mortar: `${ART_BASE}/stratagems/m12_mortar_sentry.jpg`,
  sentry_tesla: `${ART_BASE}/stratagems/arc3_tesla_tower.jpg`,
  sentry_rocket: `${ART_BASE}/stratagems/mls4x_rocket_sentry.jpg`,
  sentry_ems: `${ART_BASE}/stratagems/m23_ems_mortar_sentry.jpg`,
  sentry_laser: `${ART_BASE}/stratagems/las98_laser_sentry.jpg`,
  sentry_flame: `${ART_BASE}/stratagems/flam40_flame_sentry.jpg`,
  sentry_gas_mortar: `${ART_BASE}/stratagems/gm17_gas_mortar_sentry.jpg`,
  sentry_at_emplacement: `${ART_BASE}/stratagems/at12_anti_tank_emplacement.jpg`,
  sentry_hmg_emplacement: `${ART_BASE}/stratagems/emg101_hmg_emplacement.jpg`,
  sentry_grenadier: `${ART_BASE}/stratagems/gl21_grenadier_battlement.jpg`,
  sentry_shield_relay: `${ART_BASE}/stratagems/fx12_shield_generator_relay.jpg`,

  // ── SUPPORT WEAPONS ──
  support_recoilless: `${ART_BASE}/stratagems/recoilless_rifle.jpg`,
  support_amr: `${ART_BASE}/stratagems/anti_materiel_rifle.jpg`,
  support_stalwart: `${ART_BASE}/stratagems/stalwart.jpg`,
  support_flamer: `${ART_BASE}/stratagems/flamethrower.jpg`,
  support_arc: `${ART_BASE}/stratagems/arc_thrower.jpg`,
  support_eat: `${ART_BASE}/stratagems/expendable_anti_tank.jpg`,
  support_rg: `${ART_BASE}/stratagems/railgun.jpg`,
  support_grenade: `${ART_BASE}/stratagems/grenade_launcher.jpg`,
  support_autocannon: `${ART_BASE}/stratagems/autocannon.jpg`,
  support_machine_gun: `${ART_BASE}/stratagems/machine_gun.jpg`,
  support_hmg: `${ART_BASE}/stratagems/heavy_machine_gun.jpg`,
  support_laser_cannon: `${ART_BASE}/stratagems/laser_cannon.jpg`,
  support_airburst: `${ART_BASE}/stratagems/airburst_rocket_launcher.jpg`,
  support_breaching_hammer: `${ART_BASE}/stratagems/breaching_hammer.jpg`,
  support_exosuit: `${ART_BASE}/stratagems/exo55_breakthrough_exosuit.jpg`,
  support_quasar: `${ART_BASE}/stratagems/quasar_cannon.jpg`,
  support_spear: `${ART_BASE}/stratagems/spear.jpg`,
  support_hellbomb: `${ART_BASE}/stratagems/hellbomb.jpg`,

  // ── BACKPACKS / UTILITY ──
  util_shield: `${ART_BASE}/stratagems/sh32_shield_generator_pack.jpg`,
  util_ballistic_shield: `${ART_BASE}/stratagems/sh20_ballistic_shield_backpack.jpg`,
  util_supply_pack: `${ART_BASE}/stratagems/b1_supply_pack.jpg`,
  util_guard_dog: `${ART_BASE}/stratagems/ar23_guard_dog.jpg`,
  util_las_rover: `${ART_BASE}/stratagems/las5_rover.jpg`,
  util_jump_pack: `${ART_BASE}/stratagems/lift850_jump_pack.jpg`,
  util_resupply: `${ART_BASE}/stratagems/resupply.jpg`,
  util_reinforce: `${ART_BASE}/stratagems/reinforce.jpg`,
  util_shield_relay: `${ART_BASE}/stratagems/fx12_shield_generator_relay.jpg`,
  util_stim: `${ART_BASE}/stratagems/stim.jpg`,
};

export function getCardArt(cardId: string): string | null {
  return CARD_ART[cardId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// ARMORS — maps armor id → full-body Helldiver portrait
// Drop renders at /public/art/armors/<id>.jpg and they auto-populate
// the codex armor showcase. Missing files fall back to a silhouette
// placeholder in the UI.
// ──────────────────────────────────────────────────────────────────────
// Cache buster: bump when we replace the underlying art so browsers
// + Vercel's CDN don't serve a stale copy at the same filename.
const ARMOR_VER = "v=3";
const ARMOR_ART: Record<string, string> = {
  scout: `${ART_BASE}/armors/scout.jpg?${ARMOR_VER}`,
  frontline: `${ART_BASE}/armors/frontline.jpg?${ARMOR_VER}`,
  fortified: `${ART_BASE}/armors/fortified.jpg?${ARMOR_VER}`,
  champion: `${ART_BASE}/armors/champion.jpg?${ARMOR_VER}`,
  ground_breaker: `${ART_BASE}/armors/ground_breaker.jpg?${ARMOR_VER}`,
  hard_liner: `${ART_BASE}/armors/hard_liner.jpg?${ARMOR_VER}`,
};

export function getArmorArt(armorId: string): string | null {
  return ARMOR_ART[armorId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// PRIMARY WEAPONS — maps weapon id → cinematic portrait
// Drop renders at /public/art/weapons/<id>.jpg.
// Cache buster: bump WEAPON_VER any time the underlying art is replaced.
// ──────────────────────────────────────────────────────────────────────
const WEAPON_VER = "v=1";
const WEAPON_ART: Record<string, string> = {
  // Assault / rifles
  ar2_coyote:                 `${ART_BASE}/weapons/ar2_coyote.jpg?${WEAPON_VER}`,
  ar23p_liberator_penetrator: `${ART_BASE}/weapons/ar23p_liberator_penetrator.jpg?${WEAPON_VER}`,
  r2124_constitution:         `${ART_BASE}/weapons/r2124_constitution.jpg?${WEAPON_VER}`,
  // DMR / sniper
  r6_deadeye:                 `${ART_BASE}/weapons/r6_deadeye.jpg?${WEAPON_VER}`,
  // Explosive
  r36_eruptor:                `${ART_BASE}/weapons/r36_eruptor.jpg?${WEAPON_VER}`,
  jar5_dominator:             `${ART_BASE}/weapons/jar5_dominator.jpg?${WEAPON_VER}`,
  cb9_exploding_crossbow:     `${ART_BASE}/weapons/cb9_exploding_crossbow.jpg?${WEAPON_VER}`,
  // Energy / plasma / arc
  sg8p_punisher_plasma:       `${ART_BASE}/weapons/sg8p_punisher_plasma.jpg?${WEAPON_VER}`,
  arc12_blitzer:              `${ART_BASE}/weapons/arc12_blitzer.jpg?${WEAPON_VER}`,
  // Shotguns
  sg20_halt:                  `${ART_BASE}/weapons/sg20_halt.jpg?${WEAPON_VER}`,
  sg451_cookout:              `${ART_BASE}/weapons/sg451_cookout.jpg?${WEAPON_VER}`,
  // Adaptive / special
  vg70_variable:              `${ART_BASE}/weapons/vg70_variable.jpg?${WEAPON_VER}`,
};

export function getWeaponArt(weaponId: string): string | null {
  return WEAPON_ART[weaponId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// BOOSTERS — maps booster id → cinematic portrait
// Drop renders at /public/art/boosters/<id>.jpg.
// All entries currently point at filenames the user is going to fill in
// (cards render with a tinted silhouette fallback until then). Bump
// BOOSTER_VER any time the underlying art is replaced.
// ──────────────────────────────────────────────────────────────────────
const BOOSTER_VER = "v=1";
const BOOSTER_ART: Record<string, string> = {
  hellpod_optimization:    `${ART_BASE}/boosters/hellpod_optimization.jpg?${BOOSTER_VER}`,
  vitality_enhancement:    `${ART_BASE}/boosters/vitality_enhancement.jpg?${BOOSTER_VER}`,
  stamina_enhancement:     `${ART_BASE}/boosters/stamina_enhancement.jpg?${BOOSTER_VER}`,
  localization_confusion:  `${ART_BASE}/boosters/localization_confusion.jpg?${BOOSTER_VER}`,
  muscle_enhancement:      `${ART_BASE}/boosters/muscle_enhancement.jpg?${BOOSTER_VER}`,
  increased_reinforcement: `${ART_BASE}/boosters/increased_reinforcement.jpg?${BOOSTER_VER}`,
  firebomb_hellpods:       `${ART_BASE}/boosters/firebomb_hellpods.jpg?${BOOSTER_VER}`,
};

export function getBoosterArt(boosterId: string): string | null {
  return BOOSTER_ART[boosterId] ?? null;
}

// ──────────────────────────────────────────────────────────────────────
// MISC
// ──────────────────────────────────────────────────────────────────────
export const HELLDIVER_PORTRAIT = `${ART_BASE}/misc/helldiver_portrait.png`;
