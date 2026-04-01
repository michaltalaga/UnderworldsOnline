import type { PloyEffect } from "../definitions/PloyEffect";
import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";

export class PloyResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly cardId: CardId;
  public readonly cardDefinitionId: CardDefinitionId;
  public readonly cardName: string;
  public readonly targetFighterId: FighterId | null;
  public readonly targetFighterName: string | null;
  public readonly targetOwnerPlayerId: PlayerId | null;
  public readonly targetOwnerPlayerName: string | null;
  public readonly effectsResolved: readonly PloyEffect[];
  public readonly effectSummaries: readonly string[];

  public constructor(
    playerId: PlayerId,
    playerName: string,
    cardId: CardId,
    cardDefinitionId: CardDefinitionId,
    cardName: string,
    targetFighterId: FighterId | null,
    targetFighterName: string | null,
    targetOwnerPlayerId: PlayerId | null,
    targetOwnerPlayerName: string | null,
    effectsResolved: readonly PloyEffect[],
    effectSummaries: readonly string[],
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.cardId = cardId;
    this.cardDefinitionId = cardDefinitionId;
    this.cardName = cardName;
    this.targetFighterId = targetFighterId;
    this.targetFighterName = targetFighterName;
    this.targetOwnerPlayerId = targetOwnerPlayerId;
    this.targetOwnerPlayerName = targetOwnerPlayerName;
    this.effectsResolved = effectsResolved;
    this.effectSummaries = effectSummaries;
  }
}
