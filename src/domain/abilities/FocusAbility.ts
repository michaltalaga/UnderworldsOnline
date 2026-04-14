import { FocusAction } from "../actions/FocusAction";
import { GameAction } from "../actions/GameAction";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { Ability } from "./Ability";

export class FocusAbility extends Ability {
  readonly name = "Focus";

  getLegalActions(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    return [new FocusAction(player)];
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof FocusAction)) return false;
    if (!game.isCombatActionStep(action.player.id)) return false;

    const uniqueObjectives = new Set(action.objectiveCards);
    if (uniqueObjectives.size !== action.objectiveCards.length) return false;
    const uniquePower = new Set(action.powerCards);
    if (uniquePower.size !== action.powerCards.length) return false;

    return (
      action.objectiveCards.every((card) => action.player.objectiveHand.includes(card)) &&
      action.powerCards.every((card) => action.player.powerHand.includes(card))
    );
  }
}
