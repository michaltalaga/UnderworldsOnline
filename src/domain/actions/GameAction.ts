import type { PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";

export abstract class GameAction {
  public readonly kind: GameActionKind;
  public readonly playerId: PlayerId;

  protected constructor(kind: GameActionKind, playerId: PlayerId) {
    this.kind = kind;
    this.playerId = playerId;
  }
}
