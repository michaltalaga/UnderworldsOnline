import type { FeatureTokenId, FighterId, HexId } from "../values/ids";
import { FeatureTokenSide } from "../values/enums";

export class FeatureTokenState {
  public readonly id: FeatureTokenId;
  public readonly value: number;
  public hexId: HexId;
  public side: FeatureTokenSide;
  public heldByFighterId: FighterId | null;

  public constructor(
    id: FeatureTokenId,
    value: number,
    hexId: HexId,
    side: FeatureTokenSide = FeatureTokenSide.Hidden,
    heldByFighterId: FighterId | null = null,
  ) {
    this.id = id;
    this.value = value;
    this.hexId = hexId;
    this.side = side;
    this.heldByFighterId = heldByFighterId;
  }
}
