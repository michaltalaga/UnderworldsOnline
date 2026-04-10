import type { PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class EndActionStepAction extends GameAction {
  public constructor(playerId: PlayerId) {
    super(GameActionKind.EndActionStep, playerId);
  }
}
