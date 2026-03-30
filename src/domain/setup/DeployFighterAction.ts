import type { FighterId, HexId, PlayerId } from "../values/ids";
import { SetupActionKind } from "../values/enums";
import { SetupAction } from "./SetupAction";

export class DeployFighterAction extends SetupAction {
  public readonly fighterId: FighterId;
  public readonly hexId: HexId;

  public constructor(playerId: PlayerId, fighterId: FighterId, hexId: HexId) {
    super(SetupActionKind.DeployFighter, playerId);
    this.fighterId = fighterId;
    this.hexId = hexId;
  }
}
