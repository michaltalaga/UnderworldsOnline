import { AttackDieFace, CombatOutcome, SaveDieFace } from "../values/enums";
import { CombatContext } from "./CombatContext";

export class CombatResult {
  public readonly context: CombatContext;
  public readonly selectedAbilityRequiresCritical: boolean;
  public readonly selectedAbilityTriggered: boolean;
  public readonly attackRoll: AttackDieFace[];
  public readonly saveRoll: SaveDieFace[];
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
    context: CombatContext,
    selectedAbilityRequiresCritical: boolean,
    selectedAbilityTriggered: boolean,
    attackRoll: AttackDieFace[],
    saveRoll: SaveDieFace[],
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
  ) {
    this.context = context;
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
