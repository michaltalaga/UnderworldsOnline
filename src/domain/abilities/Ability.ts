import type { GameAction } from "../actions/GameAction";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";

/**
 * Base class for all abilities a player can use during the action step.
 * Each ability knows how to generate legal actions and validate them.
 * The engine (GameEngine) owns the apply logic.
 */
export abstract class Ability {
  abstract readonly name: string;

  /** All legal actions this ability can produce right now. */
  abstract getLegalActions(game: Game, player: Player): GameAction[];

  /** Is this specific action legal? */
  abstract isLegalAction(game: Game, action: GameAction): boolean;
}
