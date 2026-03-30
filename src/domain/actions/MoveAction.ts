import type { FighterId, HexId, PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class MoveAction extends GameAction {
  public readonly fighterId: FighterId;
  public readonly path: HexId[];

  public constructor(playerId: PlayerId, fighterId: FighterId, path: HexId[]) {
    super(GameActionKind.Move, playerId);
    this.fighterId = fighterId;
    this.path = path;
  }
}
