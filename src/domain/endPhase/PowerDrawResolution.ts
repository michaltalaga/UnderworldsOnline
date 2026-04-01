import type { CardDefinitionId, CardId, PlayerId } from "../values/ids";

export type PowerDrawCardResolution = {
  cardId: CardId;
  cardDefinitionId: CardDefinitionId;
  cardName: string;
};

export type PowerDrawPlayerResolution = {
  playerId: PlayerId;
  playerName: string;
  cardsDrawn: readonly PowerDrawCardResolution[];
};

export class PowerDrawResolution {
  public readonly roundNumber: number;
  public readonly playerResolutions: readonly PowerDrawPlayerResolution[];
  public readonly totalCardsDrawn: number;

  public constructor(
    roundNumber: number,
    playerResolutions: readonly PowerDrawPlayerResolution[],
  ) {
    this.roundNumber = roundNumber;
    this.playerResolutions = playerResolutions;
    this.totalCardsDrawn = playerResolutions.reduce(
      (total, playerResolution) => total + playerResolution.cardsDrawn.length,
      0,
    );
  }
}
