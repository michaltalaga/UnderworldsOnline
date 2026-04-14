import type { Player } from "../state/Player";
import { GameActionKind } from "../values/enums";

export abstract class GameAction {
  public readonly kind: GameActionKind;
  public readonly player: Player;

  protected constructor(kind: GameActionKind, player: Player) {
    this.kind = kind;
    this.player = player;
  }
}
