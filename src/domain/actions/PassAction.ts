import type { PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class PassAction extends GameAction {
  public constructor(playerId: PlayerId) {
    super(GameActionKind.Pass, playerId);
  }
}
