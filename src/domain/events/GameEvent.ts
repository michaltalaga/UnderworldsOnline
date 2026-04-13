import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameEventInvokerKind } from "../state/GameRecord";

/**
 * Abstract base class for all game events.
 *
 * Events are immutable records of something that happened (past tense).
 * They hold **object references** to entities (Player, Fighter, Card),
 * not string IDs.  Card eligibility logic uses `instanceof` to
 * pattern-match on event types and `===` for reference equality.
 */
export abstract class GameEvent {
  public readonly roundNumber: number;
  public readonly invokedByPlayer: Player | null;
  public readonly invokedByFighter: Fighter | null;
  public readonly invokedByCard: Card | null;
  public readonly actionKind: GameEventInvokerKind | null;

  protected constructor(
    roundNumber: number,
    invokedByPlayer: Player | null,
    invokedByFighter: Fighter | null,
    invokedByCard: Card | null,
    actionKind: GameEventInvokerKind | null,
  ) {
    this.roundNumber = roundNumber;
    this.invokedByPlayer = invokedByPlayer;
    this.invokedByFighter = invokedByFighter;
    this.invokedByCard = invokedByCard;
    this.actionKind = actionKind;
  }
}
