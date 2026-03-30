import type { FeatureTokenId, HexId, TerritoryId } from "../values/ids";
import { BoardSide } from "../values/enums";
import { FeatureTokenState } from "./FeatureTokenState";
import { HexCell } from "./HexCell";
import { Territory } from "./Territory";

export class BoardState {
  public layoutId: string;
  public side: BoardSide;
  public hexes: HexCell[];
  public territories: Territory[];
  public featureTokens: FeatureTokenState[];

  public constructor(
    layoutId: string,
    side: BoardSide = BoardSide.Front,
    hexes: HexCell[] = [],
    territories: Territory[] = [],
    featureTokens: FeatureTokenState[] = [],
  ) {
    this.layoutId = layoutId;
    this.side = side;
    this.hexes = hexes;
    this.territories = territories;
    this.featureTokens = featureTokens;
  }

  public getHex(hexId: HexId): HexCell | undefined {
    return this.hexes.find((hex) => hex.id === hexId);
  }

  public getTerritory(territoryId: TerritoryId): Territory | undefined {
    return this.territories.find((territory) => territory.id === territoryId);
  }

  public getFeatureToken(featureTokenId: FeatureTokenId): FeatureTokenState | undefined {
    return this.featureTokens.find((token) => token.id === featureTokenId);
  }
}
