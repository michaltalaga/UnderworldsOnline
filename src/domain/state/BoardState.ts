import type { FeatureTokenId, HexId, TerritoryId } from "../values/ids";
import { BoardSide } from "../values/enums";
import { FeatureTokenState } from "./FeatureTokenState";
import { HexCell } from "./HexCell";
import { Territory } from "./Territory";

// Axial neighbor offsets for a pointy-top hex grid. The board is the single
// owner of hex spatial knowledge — no other file should know these offsets.
const hexNeighborOffsets: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

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

  // Returns the hexes directly adjacent to `hex` on the currently active
  // side. The neighbor offset table lives here so the rest of the engine
  // never has to know about axial coordinates.
  public getNeighbors(hex: HexCell): HexCell[] {
    const currentHexes = this.hexes;
    return hexNeighborOffsets.flatMap(([qOffset, rOffset]) => {
      const neighbor = currentHexes.find(
        (candidate) => candidate.q === hex.q + qOffset && candidate.r === hex.r + rOffset,
      );
      return neighbor === undefined ? [] : [neighbor];
    });
  }

  // Pure coordinate check — no hex collection lookup — so callers can use it
  // without depending on the active side.
  public areAdjacent(a: HexCell, b: HexCell): boolean {
    return hexNeighborOffsets.some(
      ([qOffset, rOffset]) => a.q + qOffset === b.q && a.r + rOffset === b.r,
    );
  }

  // Cube distance between two axial coordinates. Used by range/LOS checks.
  public getDistance(a: HexCell, b: HexCell): number {
    const qDistance = a.q - b.q;
    const rDistance = a.r - b.r;
    const sDistance = (a.q + a.r) - (b.q + b.r);
    return (Math.abs(qDistance) + Math.abs(rDistance) + Math.abs(sDistance)) / 2;
  }

  // BFS over traversable hexes up to `maxDistance` steps away from `origin`.
  // Returns the set of reachable hex ids (excluding `origin`). Callers
  // supply the traversability predicate so blocked/occupied rules stay out
  // of the board. Used by move/charge range queries.
  public getReachableHexIds(
    origin: HexCell,
    maxDistance: number,
    isTraversable: (hex: HexCell) => boolean,
  ): Set<HexId> {
    const reachable = new Set<HexId>();
    if (maxDistance <= 0) {
      return reachable;
    }

    const frontier: { hex: HexCell; distance: number }[] = [{ hex: origin, distance: 0 }];
    const visited = new Set<HexId>([origin.id]);

    while (frontier.length > 0) {
      const current = frontier.shift();
      if (current === undefined || current.distance >= maxDistance) {
        continue;
      }

      for (const neighbor of this.getNeighbors(current.hex)) {
        if (visited.has(neighbor.id) || !isTraversable(neighbor)) {
          continue;
        }
        visited.add(neighbor.id);
        reachable.add(neighbor.id);
        frontier.push({ hex: neighbor, distance: current.distance + 1 });
      }
    }

    return reachable;
  }

  // Recomputes `isEdgeHex` on every hex on both sides. An edge hex has at
  // least one neighbor position that is not part of the same side's hex
  // set. Content factories call this after building the hex grid so they
  // don't have to know about neighbor offsets.
  public recomputeEdgeFlags(): void {
    this.computeEdgeFlagsForHexes(this.frontHexes);
    if (this.backHexes.length > 0) {
      this.computeEdgeFlagsForHexes(this.backHexes);
    }
  }

  private computeEdgeFlagsForHexes(hexes: HexCell[]): void {
    const coordinateSet = new Set(hexes.map((hex) => `${hex.q},${hex.r}`));
    for (const hex of hexes) {
      hex.isEdgeHex = hexNeighborOffsets.some(([qOffset, rOffset]) => {
        return !coordinateSet.has(`${hex.q + qOffset},${hex.r + rOffset}`);
      });
    }
  }

  private hasBackSide(): boolean {
    return this.backHexes.length > 0 || this.backTerritories.length > 0;
  }
}
