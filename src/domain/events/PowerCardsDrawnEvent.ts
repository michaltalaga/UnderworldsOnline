import type { Card } from "../cards/Card";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export type PowerDrawPlayerSnapshot = {
  readonly player: Player;
  readonly cardsDrawn: readonly Card[];
};

export class PowerCardsDrawnEvent extends GameEvent {
  public readonly playerResolutions: readonly PowerDrawPlayerSnapshot[];
  public readonly totalCardsDrawn: number;

  public constructor(
    roundNumber: number,
    playerResolutions: readonly PowerDrawPlayerSnapshot[],
  ) {
    super(roundNumber, null, null, null, null);
    this.playerResolutions = playerResolutions;
    this.totalCardsDrawn = playerResolutions.reduce((sum, r) => sum + r.cardsDrawn.length, 0);
  }
}
