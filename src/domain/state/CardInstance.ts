import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";
import { CardZone } from "../values/enums";

export class CardInstance {
  public readonly id: CardId;
  public readonly definitionId: CardDefinitionId;
  public readonly ownerPlayerId: PlayerId;
  public zone: CardZone;
  public attachedToFighterId: FighterId | null;
  public revealed: boolean;

  public constructor(
    id: CardId,
    definitionId: CardDefinitionId,
    ownerPlayerId: PlayerId,
    zone: CardZone,
    attachedToFighterId: FighterId | null = null,
    revealed: boolean = false,
  ) {
    this.id = id;
    this.definitionId = definitionId;
    this.ownerPlayerId = ownerPlayerId;
    this.zone = zone;
    this.attachedToFighterId = attachedToFighterId;
    this.revealed = revealed;
  }
}
