import type { CardKind, CardZone, ObjectiveConditionTiming } from "../values/enums";
import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";

export class CardResolvedResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly cardId: CardId;
  public readonly cardDefinitionId: CardDefinitionId;
  public readonly cardKind: CardKind;
  public readonly cardName: string;
  public readonly toZone: CardZone;
  public readonly targetFighterId: FighterId | null;
  public readonly targetFighterName: string | null;
  public readonly targetOwnerPlayerId: PlayerId | null;
  public readonly targetOwnerPlayerName: string | null;
  public readonly timing: ObjectiveConditionTiming | null;
  public readonly gloryDelta: number;
  public readonly effectSummaries: readonly string[];

  public constructor(
    playerId: PlayerId,
    playerName: string,
    cardId: CardId,
    cardDefinitionId: CardDefinitionId,
    cardKind: CardKind,
    cardName: string,
    toZone: CardZone,
    targetFighterId: FighterId | null,
    targetFighterName: string | null,
    targetOwnerPlayerId: PlayerId | null,
    targetOwnerPlayerName: string | null,
    timing: ObjectiveConditionTiming | null,
    gloryDelta: number,
    effectSummaries: readonly string[],
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.cardId = cardId;
    this.cardDefinitionId = cardDefinitionId;
    this.cardKind = cardKind;
    this.cardName = cardName;
    this.toZone = toZone;
    this.targetFighterId = targetFighterId;
    this.targetFighterName = targetFighterName;
    this.targetOwnerPlayerId = targetOwnerPlayerId;
    this.targetOwnerPlayerName = targetOwnerPlayerName;
    this.timing = timing;
    this.gloryDelta = gloryDelta;
    this.effectSummaries = effectSummaries;
  }
}
