import type { HexId, PlayerId } from "../values/ids";
import { SetupActionKind } from "../values/enums";
import { SetupAction } from "./SetupAction";

export class PlaceFeatureTokenAction extends SetupAction {
  public readonly hexId: HexId;

  public constructor(playerId: PlayerId, hexId: HexId) {
    super(SetupActionKind.PlaceFeatureToken, playerId);
    this.hexId = hexId;
  }
}
