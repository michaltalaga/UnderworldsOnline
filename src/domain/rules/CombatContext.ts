import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";
import { WeaponAbilityKind } from "../values/enums";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class CombatContext {
  public readonly attackerPlayer: Player;
  public readonly defenderPlayer: Player;
  public readonly attacker: Fighter;
  public readonly target: Fighter;
  public readonly weapon: WeaponDefinition;
  public readonly selectedAbility: WeaponAbilityKind | null;

  public constructor(
    attackerPlayer: Player,
    defenderPlayer: Player,
    attacker: Fighter,
    target: Fighter,
    weapon: WeaponDefinition,
    selectedAbility: WeaponAbilityKind | null = null,
  ) {
    this.attackerPlayer = attackerPlayer;
    this.defenderPlayer = defenderPlayer;
    this.attacker = attacker;
    this.target = target;
    this.weapon = weapon;
    this.selectedAbility = selectedAbility;
  }

  public get attackerPlayerId(): PlayerId { return this.attackerPlayer.id; }
  public get defenderPlayerId(): PlayerId { return this.defenderPlayer.id; }
  public get attackerFighterId(): FighterId { return this.attacker.id; }
  public get targetFighterId(): FighterId { return this.target.id; }
  public get weaponId(): WeaponDefinitionId { return this.weapon.id; }
}
