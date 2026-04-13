import type { GameActionKind } from "../values/enums";
import type { Card } from "../cards/Card";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class FighterFocusedEvent extends GameEvent {
  public readonly player: Player;
  public readonly discardedObjectives: readonly Card[];
  public readonly discardedPowerCards: readonly Card[];
  public readonly drawnObjectives: readonly Card[];
  public readonly drawnPowerCards: readonly Card[];

  public constructor(
    roundNumber: number,
    player: Player,
    discardedObjectives: readonly Card[],
    discardedPowerCards: readonly Card[],
    drawnObjectives: readonly Card[],
    drawnPowerCards: readonly Card[],
    actionKind: GameActionKind,
  ) {
    super(roundNumber, player, null, null, actionKind);
    this.player = player;
    this.discardedObjectives = discardedObjectives;
    this.discardedPowerCards = discardedPowerCards;
    this.drawnObjectives = drawnObjectives;
    this.drawnPowerCards = drawnPowerCards;
  }
}
