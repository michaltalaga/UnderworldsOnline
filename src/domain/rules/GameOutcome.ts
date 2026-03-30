import type { PlayerId } from "../values/ids";
import { GameOutcomeKind } from "../values/enums";

export class GameOutcome {
  public readonly kind: GameOutcomeKind;
  public readonly winnerPlayerId: PlayerId | null;
  public readonly reason: string;

  public constructor(kind: GameOutcomeKind, winnerPlayerId: PlayerId | null, reason: string) {
    this.kind = kind;
    this.winnerPlayerId = winnerPlayerId;
    this.reason = reason;
  }
}
