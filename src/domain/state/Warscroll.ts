import type { PlayerId, WarscrollDefinitionId } from "../values/ids";

export class Warscroll {
  public readonly ownerPlayerId: PlayerId;
  public readonly definitionId: WarscrollDefinitionId;
  public tokens: Record<string, number>;

  public constructor(
    ownerPlayerId: PlayerId,
    definitionId: WarscrollDefinitionId,
    tokens: Record<string, number> = {},
  ) {
    this.ownerPlayerId = ownerPlayerId;
    this.definitionId = definitionId;
    this.tokens = tokens;
  }
}
