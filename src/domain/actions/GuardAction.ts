import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import { GuardAbility } from "../abilities/GuardAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class GuardAction extends GameAction {
  public readonly fighter: Fighter;

  public constructor(player: Player, fighter: Fighter) {
    super(GameActionKind.Guard, player);
    this.fighter = fighter;
  }
}

const guardAbility = new GuardAbility();

export const GuardActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    if (hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return guardAbility.getLegalActions(game, player);
  },
};
