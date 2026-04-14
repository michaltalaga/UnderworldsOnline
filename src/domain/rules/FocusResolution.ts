import type { CardDefinitionId, CardId, PlayerId } from "../values/ids";
import type { Player } from "../state/Player";

export type FocusCardResolution = {
  cardId: CardId;
  cardDefinitionId: CardDefinitionId;
  cardName: string;
};

export class FocusResolution {
  public readonly player: Player;
  public readonly discardedObjectives: readonly FocusCardResolution[];
  public readonly discardedPowerCards: readonly FocusCardResolution[];
  public readonly drawnObjectives: readonly FocusCardResolution[];
  public readonly drawnPowerCards: readonly FocusCardResolution[];

  public constructor(
    player: Player,
    discardedObjectives: readonly FocusCardResolution[],
    discardedPowerCards: readonly FocusCardResolution[],
    drawnObjectives: readonly FocusCardResolution[],
    drawnPowerCards: readonly FocusCardResolution[],
  ) {
    this.player = player;
    this.discardedObjectives = discardedObjectives;
    this.discardedPowerCards = discardedPowerCards;
    this.drawnObjectives = drawnObjectives;
    this.drawnPowerCards = drawnPowerCards;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
}
