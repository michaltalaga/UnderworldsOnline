import type { Card } from "../cards/Card";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export type ObjectiveScoredSnapshot = {
  readonly card: Card;
  readonly gloryValue: number;
};

export type ObjectiveScoringPlayerSnapshot = {
  readonly player: Player;
  readonly gloryGained: number;
  readonly scoredObjectives: readonly ObjectiveScoredSnapshot[];
};

export class ObjectivesScoredEvent extends GameEvent {
  public readonly playerResolutions: readonly ObjectiveScoringPlayerSnapshot[];
  public readonly totalGloryGained: number;
  public readonly totalObjectivesScored: number;

  public constructor(
    roundNumber: number,
    playerResolutions: readonly ObjectiveScoringPlayerSnapshot[],
  ) {
    super(roundNumber, null, null, null, null);
    this.playerResolutions = playerResolutions;
    this.totalGloryGained = playerResolutions.reduce((sum, r) => sum + r.gloryGained, 0);
    this.totalObjectivesScored = playerResolutions.reduce((sum, r) => sum + r.scoredObjectives.length, 0);
  }
}
