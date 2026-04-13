import type { CardKind, CardZone, ObjectiveConditionTiming } from "../values/enums";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameEventInvokerKind } from "../state/GameRecord";
import { GameEvent } from "./GameEvent";

export class CardPlayedEvent extends GameEvent {
  public readonly player: Player;
  public readonly card: Card;
  public readonly cardKind: CardKind;
  public readonly fromZone: CardZone;
  public readonly targetFighter: Fighter | null;
  public readonly targetOwnerPlayer: Player | null;
  public readonly timing: ObjectiveConditionTiming | null;

  public constructor(
    roundNumber: number,
    player: Player,
    card: Card,
    cardKind: CardKind,
    fromZone: CardZone,
    targetFighter: Fighter | null,
    targetOwnerPlayer: Player | null,
    timing: ObjectiveConditionTiming | null,
    actionKind: GameEventInvokerKind | null,
  ) {
    super(roundNumber, player, null, card, actionKind);
    this.player = player;
    this.card = card;
    this.cardKind = cardKind;
    this.fromZone = fromZone;
    this.targetFighter = targetFighter;
    this.targetOwnerPlayer = targetOwnerPlayer;
    this.timing = timing;
  }
}
