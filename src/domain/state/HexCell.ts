import type { HexId } from "../values/ids";
import { HexKind } from "../values/enums";
import type { FeatureToken } from "./FeatureToken";
import type { Fighter } from "./Fighter";
import type { Territory } from "./Territory";

export class HexCell {
  public readonly id: HexId;
  public readonly q: number;
  public readonly r: number;
  public kind: HexKind;
  public isStartingHex: boolean;
  public isEdgeHex: boolean;
  public territory: Territory | null;
  public occupantFighter: Fighter | null;
  public featureToken: FeatureToken | null;

  public constructor(
    id: HexId,
    q: number,
    r: number,
    kind: HexKind,
    isStartingHex: boolean = false,
    isEdgeHex: boolean = false,
    territory: Territory | null = null,
    occupantFighter: Fighter | null = null,
    featureToken: FeatureToken | null = null,
  ) {
    this.id = id;
    this.q = q;
    this.r = r;
    this.kind = kind;
    this.isStartingHex = isStartingHex;
    this.isEdgeHex = isEdgeHex;
    this.territory = territory;
    this.occupantFighter = occupantFighter;
    this.featureToken = featureToken;
  }
}
