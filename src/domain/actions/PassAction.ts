import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { getActiveCombatState } from "../rules/CombatStateProjection";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class PassAction extends GameAction {
  public constructor(player: Player) {
    super(GameActionKind.Pass, player);
  }
}

export const PassActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    const combatState = getActiveCombatState(game);
    if (combatState !== null) return []; // can't pass during active combat
    const isActionStep = game.isCombatActionStep(player.id);
    const isPowerStep = game.isCombatPowerStep(player.id);
    if (!isActionStep && !isPowerStep) return [];
    if (isActionStep && hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return [new PassAction(player)];
  },
};
