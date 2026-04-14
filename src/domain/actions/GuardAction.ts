import type { FighterId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { GuardAbility } from "../abilities/GuardAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class GuardAction extends GameAction {
  public readonly fighterId: FighterId;

  public constructor(playerId: PlayerId, fighterId: FighterId) {
    super(GameActionKind.Guard, playerId);
    this.fighterId = fighterId;
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
