import type { PloyEffect } from "../definitions/PloyEffect";
import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class PloyResolution {
  public readonly player: Player;
  public readonly card: Card;
  public readonly targetFighter: Fighter | null;
  public readonly effectsResolved: readonly PloyEffect[];
  public readonly effectSummaries: readonly string[];

  public constructor(
    player: Player,
    card: Card,
    targetFighter: Fighter | null,
    effectsResolved: readonly PloyEffect[],
    effectSummaries: readonly string[],
  ) {
    this.player = player;
    this.card = card;
    this.targetFighter = targetFighter;
    this.effectsResolved = effectsResolved;
    this.effectSummaries = effectSummaries;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get cardId(): CardId { return this.card.id; }
  public get cardDefinitionId(): CardDefinitionId { return this.card.name as CardDefinitionId; }
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
