import type { CardDefinitionId, CardId, PlayerId } from "../values/ids";

export type FocusCardResolution = {
  cardId: CardId;
  cardDefinitionId: CardDefinitionId;
  cardName: string;
};

export class FocusResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly discardedObjectives: readonly FocusCardResolution[];
  public readonly discardedPowerCards: readonly FocusCardResolution[];
  public readonly drawnObjectives: readonly FocusCardResolution[];
  public readonly drawnPowerCards: readonly FocusCardResolution[];

  public constructor(
    playerId: PlayerId,
    playerName: string,
    discardedObjectives: readonly FocusCardResolution[],
    discardedPowerCards: readonly FocusCardResolution[],
    drawnObjectives: readonly FocusCardResolution[],
    drawnPowerCards: readonly FocusCardResolution[],
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.discardedObjectives = discardedObjectives;
    this.discardedPowerCards = discardedPowerCards;
    this.drawnObjectives = drawnObjectives;
    this.drawnPowerCards = drawnPowerCards;
  }
}
