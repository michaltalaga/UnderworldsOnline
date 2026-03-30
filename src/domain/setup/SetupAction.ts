import type { SetupActionKind } from "../values/enums";
import type { PlayerId } from "../values/ids";

export abstract class SetupAction {
  public readonly kind: SetupActionKind;
  public readonly playerId: PlayerId | null;

  protected constructor(kind: SetupActionKind, playerId: PlayerId | null = null) {
    this.kind = kind;
    this.playerId = playerId;
  }
}
