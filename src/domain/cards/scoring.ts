import type { Game } from "../state/Game";
import type { GameRecord } from "../state/GameRecord";
import { GameRecordKind } from "../state/GameRecord";
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
