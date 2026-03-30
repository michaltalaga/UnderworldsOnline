import { WeaponAbilityKind } from "../values/enums";

export class WeaponAbilityDefinition {
  public readonly kind: WeaponAbilityKind;
  public readonly requiresCritical: boolean;

  public constructor(kind: WeaponAbilityKind, requiresCritical: boolean = false) {
    this.kind = kind;
    this.requiresCritical = requiresCritical;
  }
}
