import type { WeaponAbilityKind } from "../values/enums";
import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";

export class CombatStartedResolution {
  public readonly attackerPlayerId: PlayerId;
  public readonly attackerPlayerName: string;
  public readonly attackerFighterId: FighterId;
  public readonly attackerFighterName: string;
  public readonly defenderPlayerId: PlayerId;
  public readonly defenderPlayerName: string;
  public readonly targetFighterId: FighterId;
  public readonly targetFighterName: string;
  public readonly weaponId: WeaponDefinitionId;
  public readonly weaponName: string;
  public readonly selectedAbility: WeaponAbilityKind | null;

  public constructor(
    attackerPlayerId: PlayerId,
    attackerPlayerName: string,
    attackerFighterId: FighterId,
    attackerFighterName: string,
    defenderPlayerId: PlayerId,
    defenderPlayerName: string,
    targetFighterId: FighterId,
    targetFighterName: string,
    weaponId: WeaponDefinitionId,
    weaponName: string,
    selectedAbility: WeaponAbilityKind | null,
  ) {
    this.attackerPlayerId = attackerPlayerId;
    this.attackerPlayerName = attackerPlayerName;
    this.attackerFighterId = attackerFighterId;
    this.attackerFighterName = attackerFighterName;
    this.defenderPlayerId = defenderPlayerId;
    this.defenderPlayerName = defenderPlayerName;
    this.targetFighterId = targetFighterId;
    this.targetFighterName = targetFighterName;
    this.weaponId = weaponId;
    this.weaponName = weaponName;
    this.selectedAbility = selectedAbility;
  }
}
