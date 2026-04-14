import { SetupActionKind } from "../values/enums";
import type { Player } from "../state/Player";
import { SetupAction } from "./SetupAction";

export class ResolveMulliganAction extends SetupAction {
  public override readonly player: Player;
  public readonly redrawObjectives: boolean;
  public readonly redrawPower: boolean;

  public constructor(
    player: Player,
    redrawObjectives: boolean = false,
    redrawPower: boolean = false,
  ) {
    super(SetupActionKind.ResolveMulligan, player);
    this.player = player;
    this.redrawObjectives = redrawObjectives;
    this.redrawPower = redrawPower;
  }
}
