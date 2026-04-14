import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class EndActionStepAction extends GameAction {
  public constructor(player: Player) {
    super(GameActionKind.EndActionStep, player);
  }
}

export const EndActionStepActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    if (!hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return [new EndActionStepAction(player)];
  },
};
