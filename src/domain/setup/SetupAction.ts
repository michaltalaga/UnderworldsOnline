import type { Player } from "../state/Player";
import type { SetupActionKind } from "../values/enums";

export abstract class SetupAction {
  public readonly kind: SetupActionKind;
  public readonly player: Player | null;

  protected constructor(kind: SetupActionKind, player: Player | null = null) {
    this.kind = kind;
    this.player = player;
  }
}
