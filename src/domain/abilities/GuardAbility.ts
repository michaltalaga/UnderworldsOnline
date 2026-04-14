import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { Ability } from "./Ability";
import { canFighterGuard } from "./fighterChecks";

export class GuardAbility extends Ability {
  readonly name = "Guard";

  getLegalActions(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    return player.fighters.flatMap((fighter) =>
      canFighterGuard(fighter) ? [new GuardAction(player, fighter)] : [],
    );
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof GuardAction)) return false;
    if (!game.isCombatActionStep(action.player.id)) return false;
    return canFighterGuard(action.fighter);
  }
}
