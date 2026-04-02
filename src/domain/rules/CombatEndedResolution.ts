import type { CombatOutcome, WeaponAbilityKind } from "../values/enums";
import type { AttackDieFace, SaveDieFace } from "../values/enums";
import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";

export class CombatEndedResolution {
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
  public readonly selectedAbilityRequiresCritical: boolean;
  public readonly selectedAbilityTriggered: boolean;
  public readonly attackRoll: readonly AttackDieFace[];
  public readonly saveRoll: readonly SaveDieFace[];
  public readonly outcome: CombatOutcome;
  public readonly attackSuccesses: number;
  public readonly saveSuccesses: number;
  public readonly attackCriticals: number;
  public readonly saveCriticals: number;
  public readonly damageInflicted: number;
  public readonly targetSlain: boolean;
  public readonly staggerApplied: boolean;

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
    selectedAbilityRequiresCritical: boolean,
    selectedAbilityTriggered: boolean,
    attackRoll: readonly AttackDieFace[],
    saveRoll: readonly SaveDieFace[],
    outcome: CombatOutcome,
    attackSuccesses: number,
    saveSuccesses: number,
    attackCriticals: number,
    saveCriticals: number,
    damageInflicted: number,
    targetSlain: boolean,
    staggerApplied: boolean,
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
    this.selectedAbilityRequiresCritical = selectedAbilityRequiresCritical;
    this.selectedAbilityTriggered = selectedAbilityTriggered;
    this.attackRoll = attackRoll;
    this.saveRoll = saveRoll;
    this.outcome = outcome;
    this.attackSuccesses = attackSuccesses;
    this.saveSuccesses = saveSuccesses;
    this.attackCriticals = attackCriticals;
    this.saveCriticals = saveCriticals;
    this.damageInflicted = damageInflicted;
    this.targetSlain = targetSlain;
    this.staggerApplied = staggerApplied;
  }
}
