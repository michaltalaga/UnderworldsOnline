import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Card } from "../cards/Card";
import { FocusAbility } from "../abilities/FocusAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class FocusAction extends GameAction {
  public readonly objectiveCards: Card[];
  public readonly powerCards: Card[];

  public constructor(
    player: Player,
    objectiveCards: Card[] = [],
    powerCards: Card[] = [],
  ) {
    super(GameActionKind.Focus, player);
    this.objectiveCards = objectiveCards;
    this.powerCards = powerCards;
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
