import type { CombatOutcome, WeaponAbilityKind } from "../values/enums";
import type { AttackDieFace, SaveDieFace } from "../values/enums";
import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class CombatEndedResolution {
  public readonly attackerPlayer: Player;
  public readonly attackerFighter: Fighter;
  public readonly defenderPlayer: Player;
  public readonly targetFighter: Fighter;
  public readonly weapon: WeaponDefinition;
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
    attackerPlayer: Player,
    attackerFighter: Fighter,
    defenderPlayer: Player,
    targetFighter: Fighter,
    weapon: WeaponDefinition,
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
    this.attackerPlayer = attackerPlayer;
    this.attackerFighter = attackerFighter;
    this.defenderPlayer = defenderPlayer;
    this.targetFighter = targetFighter;
    this.weapon = weapon;
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

  public get attackerPlayerId(): PlayerId { return this.attackerPlayer.id; }
  public get attackerPlayerName(): string { return this.attackerPlayer.name; }
  public get attackerFighterId(): FighterId { return this.attackerFighter.id; }
  public get attackerFighterName(): string { return this.attackerFighter.definition.name; }
  public get defenderPlayerId(): PlayerId { return this.defenderPlayer.id; }
  public get defenderPlayerName(): string { return this.defenderPlayer.name; }
  public get targetFighterId(): FighterId { return this.targetFighter.id; }
  public get targetFighterName(): string { return this.targetFighter.definition.name; }
  public get weaponId(): WeaponDefinitionId { return this.weapon.id; }
  public get weaponName(): string { return this.weapon.name; }
}
