import type { CardKind, CardZone, ObjectiveConditionTiming } from "../values/enums";
import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class CardPlayedResolution {
  public readonly player: Player;
  public readonly card: Card;
  public readonly fromZone: CardZone;
  public readonly targetFighter: Fighter | null;
  public readonly timing: ObjectiveConditionTiming | null;

  public constructor(
    player: Player,
    card: Card,
    fromZone: CardZone,
    targetFighter: Fighter | null,
    timing: ObjectiveConditionTiming | null,
  ) {
    this.player = player;
    this.card = card;
    this.fromZone = fromZone;
    this.targetFighter = targetFighter;
    this.timing = timing;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get cardId(): CardId { return this.card.id; }
  public get cardDefinitionId(): CardDefinitionId { return this.card.name as CardDefinitionId; }
  public get cardKind(): CardKind { return this.card.kind; }
  public get cardName(): string { return this.card.name; }
  public get targetFighterId(): FighterId | null { return this.targetFighter?.id ?? null; }
  public get targetFighterName(): string | null {
    return this.targetFighter?.definition.name ?? null;
  }
  public get targetOwnerPlayerId(): PlayerId | null {
    return this.targetFighter?.owner.id ?? null;
  }
  public get targetOwnerPlayerName(): string | null {
    return this.targetFighter?.owner.name ?? null;
  }
}
