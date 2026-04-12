import type { Game } from "../state/Game";
import type { Fighter } from "../state/Fighter";
import type { GameRecord } from "../state/GameRecord";
import { GameRecordKind } from "../state/GameRecord";
import { FeatureTokenSide, HexKind } from "../values/enums";
import type { PlayerId, HexId } from "../values/ids";

/**
 * Get the latest combat event invoked by the given player, or null.
 * Most immediate-score combat objectives need this exact guard.
 */
export function getMyLatestCombat(
  game: Game,
  ownerId: PlayerId,
): GameRecord<typeof GameRecordKind.Combat> | null {
  const event = game.getLatestEvent(GameRecordKind.Combat);
  if (event === null || event.invokedByPlayerId !== ownerId) return null;
  return event;
}

/**
 * Get the territory owner for a given hex, or null if the hex
 * has no territory or the territory has no owner.
 */
export function getTerritoryOwner(
  game: Game,
  hexId: HexId,
): PlayerId | null {
  const hex = game.getHex(hexId);
  if (hex?.territoryId == null) return null;
  const territory = game.getTerritory(hex.territoryId);
  return territory?.ownerPlayerId ?? null;
}

// ---------------------------------------------------------------------------
// Reusable predicates — shared by objectives, ploys, and upgrades.
// Compose these to build complex card conditions.
// ---------------------------------------------------------------------------

/** Is the fighter in enemy territory? */
export function isInEnemyTerritory(game: Game, fighter: Fighter, ownerId: PlayerId): boolean {
  if (fighter.currentHexId === null) return false;
  const owner = getTerritoryOwner(game, fighter.currentHexId);
  return owner !== null && owner !== ownerId;
}

/** Is the fighter in friendly territory? */
export function isInFriendlyTerritory(game: Game, fighter: Fighter, ownerId: PlayerId): boolean {
  if (fighter.currentHexId === null) return false;
  const owner = getTerritoryOwner(game, fighter.currentHexId);
  return owner === ownerId;
}

/** Is the fighter standing on a treasure token? */
export function isOnTreasureToken(game: Game, fighter: Fighter): boolean {
  if (fighter.currentHexId === null) return false;
  const hex = game.getHex(fighter.currentHexId);
  if (hex === undefined || hex.featureTokenId === null) return false;
  const token = game.getFeatureToken(hex.featureTokenId);
  return token !== undefined && token.side === FeatureTokenSide.Treasure;
}

/** Is the fighter standing on a feature token (any side)? */
export function isOnFeatureToken(game: Game, fighter: Fighter): boolean {
  if (fighter.currentHexId === null) return false;
  const hex = game.getHex(fighter.currentHexId);
  return hex !== undefined && hex.featureTokenId !== null;
}

/** Is the fighter on a stagger hex? */
export function isOnStaggerHex(game: Game, fighter: Fighter): boolean {
  if (fighter.currentHexId === null) return false;
  const hex = game.getHex(fighter.currentHexId);
  return hex !== undefined && hex.kind === HexKind.Stagger;
}

/** Is the weapon melee (range <= 1)? */
export function isMeleeWeapon(weapon: { range: number }): boolean {
  return weapon.range <= 1;
}
