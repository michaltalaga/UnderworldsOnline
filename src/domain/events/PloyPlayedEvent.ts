import type { GameActionKind } from "../values/enums";
import type { PloyEffect } from "../definitions/PloyEffect";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class PloyPlayedEvent extends GameEvent {
  public readonly player: Player;
  public readonly card: Card;
  public readonly targetFighter: Fighter | null;
  public readonly targetOwnerPlayer: Player | null;
  public readonly effectsResolved: readonly PloyEffect[];
  public readonly effectSummaries: readonly string[];

  public constructor(
    roundNumber: number,
    player: Player,
    card: Card,
    targetFighter: Fighter | null,
    targetOwnerPlayer: Player | null,
    effectsResolved: readonly PloyEffect[],
    effectSummaries: readonly string[],
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, null, card, actionKind);
    this.player = player;
    this.card = card;
    this.targetFighter = targetFighter;
    this.targetOwnerPlayer = targetOwnerPlayer;
    this.effectsResolved = effectsResolved;
    this.effectSummaries = effectSummaries;
  }
}
