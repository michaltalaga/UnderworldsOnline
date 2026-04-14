import type {
  AttackDieFace,
  CombatOutcome,
  SaveDieFace,
  WeaponAbilityKind,
} from "../values/enums";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameEventInvokerKind } from "../state/GameRecord";
import { GameEvent } from "./GameEvent";

export class CombatResolvedEvent extends GameEvent {
  public readonly attackerPlayer: Player;
  public readonly defenderPlayer: Player;
  public readonly attacker: Fighter;
  public readonly target: Fighter;
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
  public readonly targetMoved: boolean;
  public readonly attackerMoved: boolean;
  public readonly staggerApplied: boolean;

  public constructor(
    roundNumber: number,
    attackerPlayer: Player,
    defenderPlayer: Player,
    attacker: Fighter,
    target: Fighter,
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
    targetMoved: boolean,
    attackerMoved: boolean,
    staggerApplied: boolean,
    actionKind: GameEventInvokerKind,
  ) {
    super(roundNumber, attackerPlayer, attacker, null, actionKind);
    this.attackerPlayer = attackerPlayer;
    this.defenderPlayer = defenderPlayer;
    this.attacker = attacker;
    this.target = target;
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
    this.targetMoved = targetMoved;
    this.attackerMoved = attackerMoved;
    this.staggerApplied = staggerApplied;
  }
}
