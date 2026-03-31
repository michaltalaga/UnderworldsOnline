import { WeaponAbilityKind } from "../values/enums";

export class WeaponAbilityDefinition {
  public readonly kind: WeaponAbilityKind;
  public readonly requiresCritical: boolean;

  public constructor(kind: WeaponAbilityKind, requiresCritical: boolean = false) {
    this.kind = kind;
    this.requiresCritical = requiresCritical;
  }

  public get displayName(): string {
    return WeaponAbilityDefinition.formatName(this.kind, this.requiresCritical);
  }

  public static formatName(kind: WeaponAbilityKind, requiresCritical: boolean = false): string {
    const formattedKind = kind.charAt(0).toUpperCase() + kind.slice(1);
    return requiresCritical ? `Critical ${formattedKind}` : formattedKind;
  }
}
