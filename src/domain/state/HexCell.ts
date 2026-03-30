import type { FeatureTokenId, FighterId, HexId, TerritoryId } from "../values/ids";
import { HexKind } from "../values/enums";

export class HexCell {
  public readonly id: HexId;
  public readonly q: number;
  public readonly r: number;
  public kind: HexKind;
  public territoryId: TerritoryId | null;
  public occupantFighterId: FighterId | null;
  public featureTokenId: FeatureTokenId | null;

  public constructor(
    id: HexId,
    q: number,
    r: number,
    kind: HexKind,
    territoryId: TerritoryId | null = null,
    occupantFighterId: FighterId | null = null,
    featureTokenId: FeatureTokenId | null = null,
  ) {
    this.id = id;
    this.q = q;
    this.r = r;
    this.kind = kind;
    this.territoryId = territoryId;
    this.occupantFighterId = occupantFighterId;
    this.featureTokenId = featureTokenId;
  }
}
