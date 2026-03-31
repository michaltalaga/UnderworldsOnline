import type { WeaponDefinitionId } from "../values/ids";
import { WeaponAccuracy, type WeaponAbilityKind } from "../values/enums";
import { WeaponAbilityDefinition } from "./WeaponAbilityDefinition";

export class WeaponDefinition {
  public readonly id: WeaponDefinitionId;
  public readonly name: string;
  public readonly range: number;
  public readonly dice: number;
  public readonly accuracy: WeaponAccuracy;
  public readonly damage: number;
  public readonly abilities: readonly WeaponAbilityDefinition[];

  public constructor(
    id: WeaponDefinitionId,
    name: string,
    range: number,
    dice: number,
    accuracy: WeaponAccuracy,
    damage: number,
    abilities: readonly WeaponAbilityDefinition[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.range = range;
    this.dice = dice;
    this.accuracy = accuracy;
    this.damage = damage;
    this.abilities = abilities;
  }

  public getAbility(kind: WeaponAbilityKind | null): WeaponAbilityDefinition | null {
    if (kind === null) {
      return null;
    }

    return this.abilities.find((ability) => ability.kind === kind) ?? null;
  }

  public hasAbility(kind: WeaponAbilityKind): boolean {
    return this.getAbility(kind) !== null;
  }
}
