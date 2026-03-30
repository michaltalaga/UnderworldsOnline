import type { RollOffKind } from "../values/enums";
import type { PlayerId } from "../values/ids";

export class RollOffContext {
  public readonly playerOneId: PlayerId;
  public readonly playerTwoId: PlayerId;
  public readonly kind: RollOffKind;
  public readonly tieWinnerPlayerId: PlayerId | null;

  public constructor(
    playerOneId: PlayerId,
    playerTwoId: PlayerId,
    kind: RollOffKind,
    tieWinnerPlayerId: PlayerId | null = null,
  ) {
    this.playerOneId = playerOneId;
    this.playerTwoId = playerTwoId;
    this.kind = kind;
    this.tieWinnerPlayerId = tieWinnerPlayerId;
  }
}
