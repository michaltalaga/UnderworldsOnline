import type { CardDefinitionId, CardId, PlayerId } from "../values/ids";

export type ObjectiveScoringCardResolution = {
  cardId: CardId;
  cardDefinitionId: CardDefinitionId;
  cardName: string;
  gloryValue: number;
};

export type ObjectiveScoringPlayerResolution = {
  playerId: PlayerId;
  playerName: string;
  gloryGained: number;
  scoredObjectives: readonly ObjectiveScoringCardResolution[];
};

export class ObjectiveScoringResolution {
  public readonly roundNumber: number;
  public readonly playerResolutions: readonly ObjectiveScoringPlayerResolution[];
  public readonly totalGloryGained: number;
  public readonly totalObjectivesScored: number;

  public constructor(
    roundNumber: number,
    playerResolutions: readonly ObjectiveScoringPlayerResolution[],
  ) {
    this.roundNumber = roundNumber;
    this.playerResolutions = playerResolutions;
    this.totalGloryGained = playerResolutions.reduce(
      (total, playerResolution) => total + playerResolution.gloryGained,
      0,
    );
    this.totalObjectivesScored = playerResolutions.reduce(
      (total, playerResolution) => total + playerResolution.scoredObjectives.length,
      0,
    );
  }
}
