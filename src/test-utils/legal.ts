import {
  CombatActionService,
  GameAction,
  type Game,
  type GameActionKind,
} from "../domain";
import type { PlayerId } from "../domain/values/ids";

/**
 * Helpers for picking a specific legal action out of the aggregated
 * list. Every test otherwise repeats the `.filter(a => a instanceof X)`
 * dance — these helpers make intent obvious and throw with context
 * when the expected action isn't legal.
 */

type ActionConstructor<T extends GameAction> = new (...args: any[]) => T;

/**
 * Returns all legal actions for a player that are instances of the
 * given class. Throws nothing — returns [] if none.
 */
export function getLegalActionsOfType<T extends GameAction>(
  service: CombatActionService,
  game: Game,
  playerId: PlayerId,
  type: ActionConstructor<T>,
): T[] {
  return service
    .getLegalActions(game, playerId)
    .filter((action): action is T => action instanceof type);
}

/**
 * Returns the first legal action of the given class, or throws a
 * descriptive error. Use when the test's premise is "there should be
 * at least one legal X".
 */
export function expectFirstLegalActionOfType<T extends GameAction>(
  service: CombatActionService,
  game: Game,
  playerId: PlayerId,
  type: ActionConstructor<T>,
): T {
  const matches = getLegalActionsOfType(service, game, playerId, type);
  if (matches.length === 0) {
    throw new Error(
      `Expected at least one legal ${type.name} for player ${playerId}, found none.`,
    );
  }
  return matches[0];
}

/**
 * Returns all legal actions for a player matching the given
 * GameActionKind.  Slightly cheaper than instance-type filtering when
 * the kind is enough.
 */
export function getLegalActionsOfKind(
  service: CombatActionService,
  game: Game,
  playerId: PlayerId,
  kind: GameActionKind,
): GameAction[] {
  return service
    .getLegalActions(game, playerId)
    .filter((action) => action.kind === kind);
}
