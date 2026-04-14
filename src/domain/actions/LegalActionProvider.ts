import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { GameAction } from "./GameAction";

/**
 * Each action type exports a companion provider that knows how to
 * generate all legal instances of that action for a given player.
 *
 * This is the specification pattern applied to actions — the same
 * approach cards use via `getLegalTargets(game)`.
 */
export interface LegalActionProvider {
  getLegalInstances(game: Game, player: Player): GameAction[];
}
