import type { FighterId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class GuardAction extends GameAction {
  public readonly fighterId: FighterId;

  public constructor(playerId: PlayerId, fighterId: FighterId) {
    super(GameActionKind.Guard, playerId);
    this.fighterId = fighterId;
  }
}
