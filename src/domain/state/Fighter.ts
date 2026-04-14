import type { Card } from "../cards/Card";
import type { FighterDefinition } from "../definitions/FighterDefinition";
import type { FighterId } from "../values/ids";
import type { HexCell } from "./HexCell";
import type { Player } from "./Player";

/**
 * A fighter is a live warband piece during play. Holds object references
 * to definition, owner, current hex, and equipped upgrades — no string
 * ids for cross-references.
 */
export class Fighter {
  public readonly id: FighterId;
  public readonly definition: FighterDefinition;
  public readonly owner: Player;
  public currentHex: HexCell | null;
  public damage: number;
  public hasMoveToken: boolean;
  public hasChargeToken: boolean;
  public hasGuardToken: boolean;
  public hasStaggerToken: boolean;
  public isInspired: boolean;
  public isSlain: boolean;
  public upgrades: Card[];

  public constructor(
    id: FighterId,
    definition: FighterDefinition,
    owner: Player,
    currentHex: HexCell | null = null,
    damage: number = 0,
    hasMoveToken: boolean = false,
    hasChargeToken: boolean = false,
    hasGuardToken: boolean = false,
    hasStaggerToken: boolean = false,
    isInspired: boolean = false,
    isSlain: boolean = false,
    upgrades: Card[] = [],
  ) {
    this.id = id;
    this.definition = definition;
    this.owner = owner;
    this.currentHex = currentHex;
    this.damage = damage;
    this.hasMoveToken = hasMoveToken;
    this.hasChargeToken = hasChargeToken;
    this.hasGuardToken = hasGuardToken;
    this.hasStaggerToken = hasStaggerToken;
    this.isInspired = isInspired;
    this.isSlain = isSlain;
    this.upgrades = upgrades;
  }
}
