import type { AttackDieFace, GameActionKind, SaveDieFace, WeaponAbilityKind } from "../values/enums";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class SaveDiceRolledEvent extends GameEvent {
  public readonly attackerPlayer: Player;
  public readonly defenderPlayer: Player;
  public readonly attacker: Fighter;
  public readonly target: Fighter;
  public readonly weapon: WeaponDefinition;
  public readonly selectedAbility: WeaponAbilityKind | null;
  public readonly attackRoll: readonly AttackDieFace[];
  public readonly saveRoll: readonly SaveDieFace[];

  public constructor(
    roundNumber: number,
    attackerPlayer: Player,
    defenderPlayer: Player,
    attacker: Fighter,
    target: Fighter,
    weapon: WeaponDefinition,
    selectedAbility: WeaponAbilityKind | null,
    attackRoll: readonly AttackDieFace[],
    saveRoll: readonly SaveDieFace[],
    actionKind: GameActionKind,
  ) {
    super(roundNumber, attackerPlayer, attacker, null, actionKind);
    this.attackerPlayer = attackerPlayer;
    this.defenderPlayer = defenderPlayer;
    this.attacker = attacker;
    this.target = target;
    this.weapon = weapon;
    this.selectedAbility = selectedAbility;
    this.attackRoll = attackRoll;
    this.saveRoll = saveRoll;
  }
}
