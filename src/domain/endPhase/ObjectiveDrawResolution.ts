import type { CardDefinitionId, CardId, PlayerId } from "../values/ids";

export type ObjectiveDrawCardResolution = {
  cardId: CardId;
  cardDefinitionId: CardDefinitionId;
  cardName: string;
};

export type ObjectiveDrawPlayerResolution = {
  playerId: PlayerId;
  playerName: string;
  cardsDrawn: readonly ObjectiveDrawCardResolution[];
};

export class ObjectiveDrawResolution {
  public readonly roundNumber: number;
  public readonly playerResolutions: readonly ObjectiveDrawPlayerResolution[];
  public readonly totalCardsDrawn: number;

  public constructor(
    roundNumber: number,
    playerResolutions: readonly ObjectiveDrawPlayerResolution[],
  ) {
    this.roundNumber = roundNumber;
    this.playerResolutions = playerResolutions;
    this.totalCardsDrawn = playerResolutions.reduce(
      (total, playerResolution) => total + playerResolution.cardsDrawn.length,
      0,
    );
  }
}
