import type { Card } from "../cards/Card";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export type ObjectiveDrawPlayerSnapshot = {
  readonly player: Player;
  readonly cardsDrawn: readonly Card[];
};

export class ObjectivesDrawnEvent extends GameEvent {
  public readonly playerResolutions: readonly ObjectiveDrawPlayerSnapshot[];
  public readonly totalCardsDrawn: number;

  public constructor(
    roundNumber: number,
    playerResolutions: readonly ObjectiveDrawPlayerSnapshot[],
  ) {
    super(roundNumber, null, null, null, null);
    this.playerResolutions = playerResolutions;
    this.totalCardsDrawn = playerResolutions.reduce((sum, r) => sum + r.cardsDrawn.length, 0);
  }
}
