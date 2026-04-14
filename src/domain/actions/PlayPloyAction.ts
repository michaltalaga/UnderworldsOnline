import type { CardId, FighterId, PlayerId } from "../values/ids";
import { CardKind, GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { Fighter } from "../state/Fighter";
import { getActiveCombatState } from "../rules/CombatStateProjection";

export class PlayPloyAction extends GameAction {
  public readonly cardId: CardId;
  public readonly targetFighterId: FighterId | null;

  public constructor(playerId: PlayerId, cardId: CardId, targetFighterId: FighterId | null = null) {
    super(GameActionKind.PlayPloy, playerId);
    this.cardId = cardId;
    this.targetFighterId = targetFighterId;
  }
}

export const PlayPloyActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    // Ploys are playable in the power step OR during active combat (reaction window)
    const combatState = getActiveCombatState(game);
    const isPowerStep = game.isCombatPowerStep(player.id);
    const isReactionWindow = combatState !== null && combatState.attackerPlayer === player;
    if (!isPowerStep && !isReactionWindow) return [];

    const legalActions = new Map<string, PlayPloyAction>();
    for (const card of player.powerHand) {
      if (card.kind !== CardKind.Ploy) continue;
      const targets = card.getLegalTargets(game);
      for (const target of targets) {
        const targetFighterId = target instanceof Fighter ? target.id : null;
        const action = new PlayPloyAction(player.id, card.id, targetFighterId);
        legalActions.set(`${action.cardId}:${action.targetFighterId ?? ""}`, action);
      }
    }
    return [...legalActions.values()];
  },
};
