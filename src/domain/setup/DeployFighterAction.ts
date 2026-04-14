import { SetupActionKind } from "../values/enums";
import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import type { HexCell } from "../state/HexCell";
import { SetupAction } from "./SetupAction";

export class DeployFighterAction extends SetupAction {
  public override readonly player: Player;
  public readonly fighter: Fighter;
  public readonly hex: HexCell;

  public constructor(player: Player, fighter: Fighter, hex: HexCell) {
    super(SetupActionKind.DeployFighter, player);
    this.player = player;
    this.fighter = fighter;
    this.hex = hex;
  }
}
