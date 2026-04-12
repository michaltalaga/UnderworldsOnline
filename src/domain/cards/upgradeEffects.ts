import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import type { FighterDefinition } from "../definitions/FighterDefinition";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Game } from "../state/Game";
import type { WeaponAbilityKind } from "../values/enums";
import { UpgradeCard } from "./UpgradeCard";

// ---------------------------------------------------------------------------
// Helpers to query equipped upgrades for a fighter.
// These loop over the cards themselves and call their effect methods —
// no string matching, no external lookup. Each card owns its logic.
// ---------------------------------------------------------------------------

/** Returns the UpgradeCard instances equipped to the given fighter. */
export function getFighterUpgrades(player: Player, fighter: Fighter): UpgradeCard[] {
  return player.equippedUpgrades.filter(
    (card): card is UpgradeCard =>
      card instanceof UpgradeCard && card.attachedToFighter?.id === fighter.id,
  );
}

/** Effective move = base + sum of all upgrade bonuses. */
export function getEffectiveMove(definition: FighterDefinition, player: Player, fighter: Fighter): number {
  let bonus = 0;
  for (const card of getFighterUpgrades(player, fighter)) {
    bonus += card.getMovementBonus();
  }
  return definition.move + bonus;
}

/** Effective health = base + sum of all upgrade bonuses. */
export function getEffectiveHealth(definition: FighterDefinition, player: Player, fighter: Fighter): number {
  let bonus = 0;
  for (const card of getFighterUpgrades(player, fighter)) {
    bonus += card.getHealthBonus();
  }
  return definition.health + bonus;
}

/** Effective attack dice = base + sum of all upgrade bonuses for this weapon. */
export function getEffectiveAttackDice(weapon: WeaponDefinition, player: Player, fighter: Fighter): number {
  let bonus = 0;
  for (const card of getFighterUpgrades(player, fighter)) {
    bonus += card.getAttackDiceBonus(weapon);
  }
  return weapon.dice + bonus;
}

/** Effective save dice = base + sum of all upgrade bonuses. */
export function getEffectiveSaveDice(definition: FighterDefinition, player: Player, fighter: Fighter): number {
  let bonus = 0;
  for (const card of getFighterUpgrades(player, fighter)) {
    bonus += card.getSaveDiceBonus();
  }
  return definition.saveDice + bonus;
}

/**
 * Returns the first weapon ability granted by an equipped upgrade,
 * or null if no upgrade applies.
 */
export function getUpgradeWeaponAbility(
  weapon: WeaponDefinition,
  player: Player,
  fighter: Fighter,
  targetHealth: number,
): WeaponAbilityKind | null {
  for (const card of getFighterUpgrades(player, fighter)) {
    const ability = card.getGrantedWeaponAbility(weapon, targetHealth);
    if (ability !== null) return ability;
  }
  return null;
}

/**
 * Returns true if any equipped upgrade causes the defender to ignore
 * the given save keyword (e.g. Cleave, Ensnare).
 */
export function shouldIgnoreSaveKeyword(
  fighter: Fighter,
  keyword: WeaponAbilityKind,
  game: Game,
  defenderPlayer: Player,
): boolean {
  for (const card of getFighterUpgrades(defenderPlayer, fighter)) {
    if (card.shouldIgnoreSaveKeyword(keyword, game)) return true;
  }
  return false;
}
