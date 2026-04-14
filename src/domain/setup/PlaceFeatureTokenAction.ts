import { SetupActionKind } from "../values/enums";
import type { Player } from "../state/Player";
import type { HexCell } from "../state/HexCell";
import { SetupAction } from "./SetupAction";

export class PlaceFeatureTokenAction extends SetupAction {
  public override readonly player: Player;
  public readonly hex: HexCell;

  public constructor(player: Player, hex: HexCell) {
    super(SetupActionKind.PlaceFeatureToken, player);
    this.player = player;
    this.hex = hex;
  }
}
