import type { EndPhaseActionKind } from "../values/enums";
import type { PlayerId } from "../values/ids";

export abstract class EndPhaseAction {
  public readonly kind: EndPhaseActionKind;
  public readonly playerId: PlayerId | null;

  protected constructor(kind: EndPhaseActionKind, playerId: PlayerId | null = null) {
    this.kind = kind;
    this.playerId = playerId;
  }
}
