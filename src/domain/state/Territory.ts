import type { HexId, PlayerId, TerritoryId } from "../values/ids";
import type { HexCell } from "./HexCell";
import type { Player } from "./Player";

export class Territory {
  public readonly id: TerritoryId;
  public name: string;
  public owner: Player | null;
  public hexes: HexCell[];

  public constructor(
    id: TerritoryId,
    name: string,
    owner: Player | null = null,
    hexes: HexCell[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.owner = owner;
    this.hexes = hexes;
  }

  public get ownerPlayerId(): PlayerId | null {
    return this.owner?.id ?? null;
  }

  public get hexIds(): HexId[] {
    return this.hexes.map((hex) => hex.id);
  }
}
