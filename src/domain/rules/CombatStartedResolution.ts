import type { WeaponAbilityKind } from "../values/enums";
import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class CombatStartedResolution {
  public readonly attackerPlayer: Player;
  public readonly attackerFighter: Fighter;
  public readonly defenderPlayer: Player;
  public readonly targetFighter: Fighter;
  public readonly weapon: WeaponDefinition;
  public readonly selectedAbility: WeaponAbilityKind | null;

  public constructor(
    attackerPlayer: Player,
    attackerFighter: Fighter,
    defenderPlayer: Player,
    targetFighter: Fighter,
    weapon: WeaponDefinition,
    selectedAbility: WeaponAbilityKind | null,
  ) {
    this.attackerPlayer = attackerPlayer;
    this.attackerFighter = attackerFighter;
    this.defenderPlayer = defenderPlayer;
    this.targetFighter = targetFighter;
    this.weapon = weapon;
    this.selectedAbility = selectedAbility;
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
