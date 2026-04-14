import type { CardId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { FocusAbility } from "../abilities/FocusAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class FocusAction extends GameAction {
  public readonly objectiveCardIds: CardId[];
  public readonly powerCardIds: CardId[];

  public constructor(playerId: PlayerId, objectiveCardIds: CardId[] = [], powerCardIds: CardId[] = []) {
    super(GameActionKind.Focus, playerId);
    this.objectiveCardIds = objectiveCardIds;
    this.powerCardIds = powerCardIds;
  }
}

const focusAbility = new FocusAbility();

export const FocusActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    if (hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return focusAbility.getLegalActions(game, player);
  },
};
