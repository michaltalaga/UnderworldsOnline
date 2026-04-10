import { FocusAction } from "../actions/FocusAction";
import { GameAction } from "../actions/GameAction";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import { TurnStep } from "../values/enums";
import { Ability } from "./Ability";

export class FocusAbility extends Ability {
  readonly name = "Focus";

  getLegalActions(game: Game, player: PlayerState): GameAction[] {
    if (!this.isActionStep(game, player.id)) return [];
    return [new FocusAction(player.id)];
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof FocusAction)) return false;
    if (!this.isActionStep(game, action.playerId)) return false;
    const player = game.getPlayer(action.playerId);
    if (player === undefined) return false;

    const uniqueObjectiveIds = new Set(action.objectiveCardIds);
    if (uniqueObjectiveIds.size !== action.objectiveCardIds.length) return false;
    const uniquePowerIds = new Set(action.powerCardIds);
    if (uniquePowerIds.size !== action.powerCardIds.length) return false;

    return (
      action.objectiveCardIds.every((cardId) => player.objectiveHand.some((card) => card.id === cardId)) &&
      action.powerCardIds.every((cardId) => player.powerHand.some((card) => card.id === cardId))
    );
  }

  private isActionStep(game: Game, playerId: string): boolean {
    return game.state.kind === "combatTurn" && game.turnStep === TurnStep.Action && game.activePlayerId === playerId;
  }
}
