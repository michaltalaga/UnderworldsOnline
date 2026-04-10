import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import { TurnStep } from "../values/enums";
import { Ability } from "./Ability";
import { canFighterGuard } from "./fighterChecks";

export class GuardAbility extends Ability {
  readonly name = "Guard";

  getLegalActions(game: Game, player: PlayerState): GameAction[] {
    if (!this.isActionStep(game, player)) return [];
    return player.fighters.flatMap((fighter) =>
      canFighterGuard(fighter) ? [new GuardAction(player.id, fighter.id)] : [],
    );
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof GuardAction)) return false;
    if (!this.isActionStep(game, action)) return false;
    const player = game.getPlayer(action.playerId);
    if (player === undefined) return false;
    const fighter = player.getFighter(action.fighterId);
    return fighter !== undefined && canFighterGuard(fighter);
  }

  private isActionStep(game: Game, playerOrAction: PlayerState | { playerId: string }): boolean {
    const playerId = "id" in playerOrAction ? playerOrAction.id : playerOrAction.playerId;
    return game.state.kind === "combatTurn" && game.turnStep === TurnStep.Action && game.activePlayerId === playerId;
  }
}
