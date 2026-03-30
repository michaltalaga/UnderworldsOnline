import type { HexId, PlayerId, TerritoryId } from "../values/ids";

export class Territory {
  public readonly id: TerritoryId;
  public name: string;
  public ownerPlayerId: PlayerId | null;
  public hexIds: HexId[];

  public constructor(
    id: TerritoryId,
    name: string,
    ownerPlayerId: PlayerId | null = null,
    hexIds: HexId[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.ownerPlayerId = ownerPlayerId;
    this.hexIds = hexIds;
  }
}
