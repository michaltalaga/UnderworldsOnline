import type { FeatureTokenId, FighterId, HexId } from "../values/ids";
import { FeatureTokenSide } from "../values/enums";
import type { Fighter } from "./Fighter";
import type { HexCell } from "./HexCell";

export class FeatureToken {
  public readonly id: FeatureTokenId;
  public readonly value: number;
  public hex: HexCell;
  public side: FeatureTokenSide;
  public heldByFighter: Fighter | null;

  public constructor(
    id: FeatureTokenId,
    value: number,
    hex: HexCell,
    side: FeatureTokenSide = FeatureTokenSide.Hidden,
    heldByFighter: Fighter | null = null,
  ) {
    this.id = id;
    this.value = value;
    this.hex = hex;
    this.side = side;
    this.heldByFighter = heldByFighter;
  }

  public get hexId(): HexId {
    return this.hex.id;
  }

  public get heldByFighterId(): FighterId | null {
    return this.heldByFighter?.id ?? null;
  }
}
