import type { Game } from "../state/Game";
import type { Fighter } from "../state/Fighter";
import { HexKind } from "../values/enums";

/** Give a fighter a Guard token. */
export function giveGuard(fighter: Fighter): string[] {
  fighter.hasGuardToken = true;
  return [`gave Guard token to ${fighter.id}`];
}

/** Give a fighter a Stagger token. */
export function giveStagger(fighter: Fighter): string[] {
  fighter.hasStaggerToken = true;
  return [`gave Stagger token to ${fighter.id}`];
}

/** Heal a fighter for the given amount (default 1). */
export function heal(fighter: Fighter, amount: number = 1): string[] {
  const healed = Math.min(fighter.damage, amount);
  fighter.damage -= healed;
  return [`healed ${fighter.id} for ${healed} damage`];
}

/** Inflict damage on a fighter. */
export function dealDamage(
  fighter: Fighter,
  amount: number,
): string[] {
  fighter.damage += amount;
  return [`inflicted ${amount} damage on ${fighter.id}`];
}

/** Remove a Move token (or Charge token if no Move token). */
export function removeMovementToken(fighter: Fighter): string[] {
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
export function pushOneHex(game: Game, fighter: Fighter): string[] {
  if (fighter.currentHex === null) {
    return [`${fighter.id} is not on the board`];
  }
  const originHex = game.getFighterHex(fighter);
  if (originHex === undefined) {
    return [`${fighter.id} hex not found`];
  }
  const neighbors = game.getNeighbors(originHex);
  const emptyNeighbors = neighbors.filter(
    (hex) => hex.occupantFighter === null && hex.kind !== HexKind.Blocked,
  );
  if (emptyNeighbors.length === 0) {
    return [`${fighter.id} could not be pushed (no empty adjacent hex)`];
  }
  const destination =
    emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
  originHex.occupantFighter = null;
  destination.occupantFighter = fighter;
  fighter.currentHex = destination;
  return [`pushed ${fighter.id} to ${destination.id}`];
}

/** Push a fighter the given number of hexes. */
export function pushFighter(
  game: Game,
  fighter: Fighter,
  hexCount: number,
): string[] {
  const messages: string[] = [];
  for (let i = 0; i < hexCount; i++) {
    messages.push(...pushOneHex(game, fighter));
  }
  return messages;
}
