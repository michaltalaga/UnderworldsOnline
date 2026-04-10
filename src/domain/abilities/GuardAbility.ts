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
      canFighterGuard(fighter) ? [new GuardAction(player.id, fighter.id)] : [],
    );
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof GuardAction)) return false;
    if (!game.isCombatActionStep(action.playerId)) return false;
    const player = game.getPlayer(action.playerId);
    if (player === undefined) return false;
    const fighter = player.getFighter(action.fighterId);
    return fighter !== undefined && canFighterGuard(fighter);
  }
}
