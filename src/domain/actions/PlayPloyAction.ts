import { CardKind, GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Card } from "../cards/Card";
import { Fighter } from "../state/Fighter";
import { getActiveCombatState } from "../rules/CombatStateProjection";

export class PlayPloyAction extends GameAction {
  public readonly card: Card;
  public readonly targetFighter: Fighter | null;

  public constructor(player: Player, card: Card, targetFighter: Fighter | null = null) {
    super(GameActionKind.PlayPloy, player);
    this.card = card;
    this.targetFighter = targetFighter;
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
        const targetFighter = target instanceof Fighter ? target : null;
        const action = new PlayPloyAction(player, card, targetFighter);
        legalActions.set(`${card.id}:${targetFighter?.id ?? ""}`, action);
      }
    }
    return [...legalActions.values()];
  },
};
