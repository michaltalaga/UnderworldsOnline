import type { CardId, FighterDefinitionId, FighterId, HexId, PlayerId } from "../values/ids";

export class Fighter {
  public readonly id: FighterId;
  public readonly definitionId: FighterDefinitionId;
  public readonly ownerPlayerId: PlayerId;
  public currentHexId: HexId | null;
  public damage: number;
  public hasMoveToken: boolean;
  public hasChargeToken: boolean;
  public hasGuardToken: boolean;
  public hasStaggerToken: boolean;
  public isInspired: boolean;
  public isSlain: boolean;
  public upgradeCardIds: CardId[];

  public constructor(
    id: FighterId,
    definitionId: FighterDefinitionId,
    ownerPlayerId: PlayerId,
    currentHexId: HexId | null = null,
    damage: number = 0,
    hasMoveToken: boolean = false,
    hasChargeToken: boolean = false,
    hasGuardToken: boolean = false,
    hasStaggerToken: boolean = false,
    isInspired: boolean = false,
    isSlain: boolean = false,
    upgradeCardIds: CardId[] = [],
  ) {
    this.id = id;
    this.definitionId = definitionId;
    this.ownerPlayerId = ownerPlayerId;
    this.currentHexId = currentHexId;
    this.damage = damage;
    this.hasMoveToken = hasMoveToken;
    this.hasChargeToken = hasChargeToken;
    this.hasGuardToken = hasGuardToken;
    this.hasStaggerToken = hasStaggerToken;
    this.isInspired = isInspired;
    this.isSlain = isSlain;
    this.upgradeCardIds = upgradeCardIds;
  }
}
