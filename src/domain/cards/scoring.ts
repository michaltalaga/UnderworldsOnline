import type { Game } from "../state/Game";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameRecord } from "../state/GameRecord";
import { GameRecordKind } from "../state/GameRecord";
import { CombatResolvedEvent } from "../events/CombatResolvedEvent";
import { FighterDelvedEvent } from "../events/FighterDelvedEvent";
import { FighterMovedEvent } from "../events/FighterMovedEvent";
import { FighterSlainEvent } from "../events/FighterSlainEvent";
import { FeatureTokenSide, HexKind } from "../values/enums";
import type { PlayerId, HexId } from "../values/ids";

/**
 * Get the latest combat event invoked by the given player, or null.
 * Most immediate-score combat objectives need this exact guard.
 *
 * @deprecated Use getMyLatestCombatEvent (object-reference version) instead.
 */
export function getMyLatestCombat(
  game: Game,
  ownerId: PlayerId,
): GameRecord<typeof GameRecordKind.Combat> | null {
  const event = game.getLatestEvent(GameRecordKind.Combat);
  if (event === null || event.invokedByPlayer?.id !== ownerId) return null;
  return event;
}

/**
 * Get the latest CombatResolvedEvent where the given player was the attacker, or null.
 * Uses object reference equality (===) instead of string ID comparison.
 */
export function getMyLatestCombatEvent(
  game: Game,
  owner: Player,
): CombatResolvedEvent | null {
  const events = game.getEventsOfType(CombatResolvedEvent);
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].attackerPlayer === owner) return events[i];
  }
  return null;
}

/** Get the latest FighterSlainEvent, or null. */
export function getLatestSlainEvent(game: Game): FighterSlainEvent | null {
  return game.getLatestEventOfType(FighterSlainEvent);
}

/** Get the latest FighterDelvedEvent invoked by the given player, or null. */
export function getMyLatestDelveEvent(game: Game, owner: Player): FighterDelvedEvent | null {
  const events = game.getEventsOfType(FighterDelvedEvent);
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].player === owner) return events[i];
  }
  return null;
}

/** Get the latest FighterMovedEvent invoked by the given player, or null. */
export function getMyLatestMoveEvent(game: Game, owner: Player): FighterMovedEvent | null {
  const events = game.getEventsOfType(FighterMovedEvent);
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].player === owner) return events[i];
  }
  return null;
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
  return hex?.territory?.owner?.id ?? null;
}

// ---------------------------------------------------------------------------
// Reusable predicates — shared by objectives, ploys, and upgrades.
// Compose these to build complex card conditions.
// ---------------------------------------------------------------------------

/** Is the fighter in enemy territory? */
export function isInEnemyTerritory(_game: Game, fighter: Fighter, ownerId: PlayerId): boolean {
  const territoryOwner = fighter.currentHex?.territory?.owner ?? null;
  return territoryOwner !== null && territoryOwner.id !== ownerId;
}

/** Is the fighter in friendly territory? */
export function isInFriendlyTerritory(_game: Game, fighter: Fighter, ownerId: PlayerId): boolean {
  const territoryOwner = fighter.currentHex?.territory?.owner ?? null;
  return territoryOwner !== null && territoryOwner.id === ownerId;
}

/** Is the fighter standing on a treasure token? */
export function isOnTreasureToken(_game: Game, fighter: Fighter): boolean {
  const token = fighter.currentHex?.featureToken ?? null;
  return token !== null && token.side === FeatureTokenSide.Treasure;
}

/** Is the fighter standing on a feature token (any side)? */
export function isOnFeatureToken(_game: Game, fighter: Fighter): boolean {
  return fighter.currentHex?.featureToken != null;
}

/** Is the fighter on a stagger hex? */
export function isOnStaggerHex(_game: Game, fighter: Fighter): boolean {
  return fighter.currentHex?.kind === HexKind.Stagger;
}

/** Is the weapon melee (range <= 1)? */
export function isMeleeWeapon(weapon: { range: number }): boolean {
  return weapon.range <= 1;
}
