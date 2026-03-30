import type { PlayerId } from "../values/ids";
import { SetupActionKind } from "../values/enums";
import { SetupAction } from "./SetupAction";

export class ResolveMulliganAction extends SetupAction {
  public readonly redrawObjectives: boolean;
  public readonly redrawPower: boolean;

  public constructor(
    playerId: PlayerId,
    redrawObjectives: boolean = false,
    redrawPower: boolean = false,
  ) {
    super(SetupActionKind.ResolveMulligan, playerId);
    this.redrawObjectives = redrawObjectives;
    this.redrawPower = redrawPower;
  }
}
