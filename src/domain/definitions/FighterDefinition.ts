import type { FighterDefinitionId } from "../values/ids";
import { SaveSymbol } from "../values/enums";
import { WeaponDefinition } from "./WeaponDefinition";

export class FighterDefinition {
  public readonly id: FighterDefinitionId;
  public readonly name: string;
  public readonly move: number;
  public readonly saveDice: number;
  public readonly saveSymbol: SaveSymbol;
  public readonly health: number;
  public readonly bounty: number;
  public readonly weapons: readonly WeaponDefinition[];

  public constructor(
    id: FighterDefinitionId,
    name: string,
    move: number,
    saveDice: number,
    saveSymbol: SaveSymbol,
    health: number,
    bounty: number,
    weapons: readonly WeaponDefinition[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.move = move;
    this.saveDice = saveDice;
    this.saveSymbol = saveSymbol;
    this.health = health;
    this.bounty = bounty;
    this.weapons = weapons;
  }
}
