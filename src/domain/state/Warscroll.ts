import type { PlayerId, WarscrollDefinitionId } from "../values/ids";
import type { WarscrollDefinition } from "../definitions/WarscrollDefinition";
import type { Player } from "./Player";

export class Warscroll {
  public readonly owner: Player;
  public readonly definition: WarscrollDefinition;
  public tokens: Record<string, number>;

  public constructor(
    owner: Player,
    definition: WarscrollDefinition,
    tokens: Record<string, number> = {},
  ) {
    this.owner = owner;
    this.definition = definition;
    this.tokens = tokens;
  }

  public get ownerPlayerId(): PlayerId {
    return this.owner.id;
  }

  public get definitionId(): WarscrollDefinitionId {
    return this.definition.id;
  }
}
