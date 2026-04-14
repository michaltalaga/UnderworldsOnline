import type { PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { getActiveCombatState } from "../rules/CombatStateProjection";

/** Confirms a pending combat — resolves dice rolls into damage/effects. */
export class ConfirmCombatAction extends GameAction {
  public constructor(playerId: PlayerId) {
    super(GameActionKind.ConfirmCombat, playerId);
  }
}

export const ConfirmCombatActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    const combatState = getActiveCombatState(game);
    if (combatState === null) return [];
    if (combatState.attackerPlayer !== player) return [];
    return [new ConfirmCombatAction(player.id)];
  },
};
