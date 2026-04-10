import type { Game } from "../state/Game";
import type { FighterState } from "../state/FighterState";
import { HexKind } from "../values/enums";

/** Give a fighter a Guard token. */
export function giveGuard(fighter: FighterState): string[] {
  fighter.hasGuardToken = true;
  return [`gave Guard token to ${fighter.id}`];
}

/** Give a fighter a Stagger token. */
export function giveStagger(fighter: FighterState): string[] {
  fighter.hasStaggerToken = true;
  return [`gave Stagger token to ${fighter.id}`];
}

/** Heal a fighter for the given amount (default 1). */
export function heal(fighter: FighterState, amount: number = 1): string[] {
  const healed = Math.min(fighter.damage, amount);
  fighter.damage -= healed;
  return [`healed ${fighter.id} for ${healed} damage`];
}

/** Inflict damage on a fighter. */
export function dealDamage(
  fighter: FighterState,
  amount: number,
): string[] {
  fighter.damage += amount;
  return [`inflicted ${amount} damage on ${fighter.id}`];
}

/** Remove a Move token (or Charge token if no Move token). */
export function removeMovementToken(fighter: FighterState): string[] {
  if (fighter.hasMoveToken) {
    fighter.hasMoveToken = false;
    return [`removed Move token from ${fighter.id}`];
  }
  if (fighter.hasChargeToken) {
    fighter.hasChargeToken = false;
    return [`removed Charge token from ${fighter.id}`];
  }
  return [];
}

/** Push a fighter one hex in a random valid direction. */
export function pushOneHex(game: Game, fighter: FighterState): string[] {
  if (fighter.currentHexId === null) {
    return [`${fighter.id} is not on the board`];
  }
  const originHex = game.board.getHex(fighter.currentHexId);
  if (originHex === undefined) {
    return [`${fighter.id} hex not found`];
  }
  const neighbors = game.board.getNeighbors(originHex);
  const emptyNeighbors = neighbors.filter(
    (hex) => hex.occupantFighterId === null && hex.kind !== HexKind.Blocked,
  );
  if (emptyNeighbors.length === 0) {
    return [`${fighter.id} could not be pushed (no empty adjacent hex)`];
  }
  const destination =
    emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
  originHex.occupantFighterId = null;
  destination.occupantFighterId = fighter.id;
  fighter.currentHexId = destination.id;
  return [`pushed ${fighter.id} to ${destination.id}`];
}

/** Push a fighter the given number of hexes. */
export function pushFighter(
  game: Game,
  fighter: FighterState,
  hexCount: number,
): string[] {
  const messages: string[] = [];
  for (let i = 0; i < hexCount; i++) {
    messages.push(...pushOneHex(game, fighter));
  }
  return messages;
}
