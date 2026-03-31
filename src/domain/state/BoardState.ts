import type { FeatureTokenId, HexId, TerritoryId } from "../values/ids";
import { BoardSide } from "../values/enums";
import { FeatureTokenState } from "./FeatureTokenState";
import { HexCell } from "./HexCell";
import { Territory } from "./Territory";

export class BoardState {
  public layoutId: string;
  public side: BoardSide;
  public frontHexes: HexCell[];
  public frontTerritories: Territory[];
  public backHexes: HexCell[];
  public backTerritories: Territory[];
  public featureTokens: FeatureTokenState[];

  public constructor(
    layoutId: string,
    side: BoardSide = BoardSide.Front,
    frontHexes: HexCell[] = [],
    frontTerritories: Territory[] = [],
    featureTokens: FeatureTokenState[] = [],
    backHexes: HexCell[] = [],
    backTerritories: Territory[] = [],
  ) {
    this.layoutId = layoutId;
    this.side = side;
    this.frontHexes = frontHexes;
    this.frontTerritories = frontTerritories;
    this.backHexes = backHexes;
    this.backTerritories = backTerritories;
    this.featureTokens = featureTokens;
  }

  public get hexes(): HexCell[] {
    return this.getHexesForSide(this.side);
  }

  public get territories(): Territory[] {
    return this.getTerritoriesForSide(this.side);
  }

  public getAvailableSides(): BoardSide[] {
    return this.hasBackSide() ? [BoardSide.Front, BoardSide.Back] : [BoardSide.Front];
  }

  public getHexesForSide(side: BoardSide): HexCell[] {
    if (side === BoardSide.Back) {
      return this.hasBackSide() ? this.backHexes : [];
    }

    return this.frontHexes;
  }

  public getTerritoriesForSide(side: BoardSide): Territory[] {
    if (side === BoardSide.Back) {
      return this.hasBackSide() ? this.backTerritories : [];
    }

    return this.frontTerritories;
  }

  public setSide(side: BoardSide): void {
    if (side === BoardSide.Back && !this.hasBackSide()) {
      throw new Error(`Board ${this.layoutId} does not provide a back side.`);
    }

    this.side = side;
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

  private hasBackSide(): boolean {
    return this.backHexes.length > 0 || this.backTerritories.length > 0;
  }
}
