import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";
import { WeaponAbilityKind } from "../values/enums";

export class CombatContext {
  public readonly attackerPlayerId: PlayerId;
  public readonly defenderPlayerId: PlayerId;
  public readonly attackerFighterId: FighterId;
  public readonly targetFighterId: FighterId;
  public readonly weaponId: WeaponDefinitionId;
  public readonly selectedAbility: WeaponAbilityKind | null;

  public constructor(
    attackerPlayerId: PlayerId,
    defenderPlayerId: PlayerId,
    attackerFighterId: FighterId,
    targetFighterId: FighterId,
    weaponId: WeaponDefinitionId,
    selectedAbility: WeaponAbilityKind | null = null,
  ) {
    this.attackerPlayerId = attackerPlayerId;
    this.defenderPlayerId = defenderPlayerId;
    this.attackerFighterId = attackerFighterId;
    this.targetFighterId = targetFighterId;
    this.weaponId = weaponId;
    this.selectedAbility = selectedAbility;
  }
}
