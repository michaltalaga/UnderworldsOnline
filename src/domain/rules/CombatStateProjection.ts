import type { AttackDieFace, CombatOutcome, SaveDieFace, WeaponAbilityKind } from "../values/enums";
import type { GameEventInvokerKind } from "../state/GameRecord";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { Game } from "../state/Game";
import { AttackDiceRolledEvent } from "../events/AttackDiceRolledEvent";
import { AttackDiceModifiedEvent } from "../events/AttackDiceModifiedEvent";
import { WeaponAbilityModifiedEvent } from "../events/WeaponAbilityModifiedEvent";
import { SaveDiceRolledEvent } from "../events/SaveDiceRolledEvent";
import { CombatResolvedEvent } from "../events/CombatResolvedEvent";
import { CombatEndedEvent } from "../events/CombatEndedEvent";

export type CombatPhase = "attack-rolled" | "save-rolled" | "resolved";

export type ActiveCombatState = {
  readonly phase: CombatPhase;
  readonly attackerPlayer: Player;
  readonly defenderPlayer: Player;
  readonly attacker: Fighter;
  readonly target: Fighter;
  readonly weapon: WeaponDefinition;
  readonly selectedAbility: WeaponAbilityKind | null;
  readonly actionKind: GameEventInvokerKind;
  readonly attackRoll: readonly AttackDieFace[];
  readonly saveRoll: readonly SaveDieFace[];
  readonly outcome: CombatOutcome | null;
  readonly damageInflicted: number;
};

/**
 * Derives the current combat state from the event log.
 * Returns null if no combat is active.
 *
 * This replaces the mutable `game.pendingCombat` state bag.
 * The event log is the source of truth.
 */
export function getActiveCombatState(game: Game): ActiveCombatState | null {
  const latestAttackRolled = game.getLatestEventOfType(AttackDiceRolledEvent);
  if (latestAttackRolled === null) return null;

  // Check if combat was already completed
  const latestEnded = game.getLatestEventOfType(CombatEndedEvent);
  if (latestEnded !== null) {
    const endedIndex = game.gameEvents.indexOf(latestEnded);
    const rolledIndex = game.gameEvents.indexOf(latestAttackRolled);
    if (endedIndex > rolledIndex) return null;
  }

  // Get effective attack roll (may have been modified by reaction ploys)
  const latestModified = game.getLatestEventAfter(latestAttackRolled, AttackDiceModifiedEvent);
  const effectiveAttackRoll = latestModified !== null
    ? latestModified.newRoll
    : latestAttackRolled.attackRoll;

  // Get effective selected ability (may have been modified by TwistTheKnife)
  const latestAbilityModified = game.getLatestEventAfter(latestAttackRolled, WeaponAbilityModifiedEvent);
  const effectiveAbility = latestAbilityModified !== null
    ? latestAbilityModified.newAbility
    : latestAttackRolled.selectedAbility;

  const actionKind = latestAttackRolled.actionKind;
  if (actionKind === null) return null;

  // Shared base fields
  const base = {
    attackerPlayer: latestAttackRolled.attackerPlayer,
    defenderPlayer: latestAttackRolled.defenderPlayer,
    attacker: latestAttackRolled.attacker,
    target: latestAttackRolled.target,
    weapon: latestAttackRolled.weapon,
    selectedAbility: effectiveAbility,
    actionKind,
  };

  // Check phases in reverse order (resolved → save-rolled → attack-rolled)
  const latestResolved = game.getLatestEventAfter(latestAttackRolled, CombatResolvedEvent);
  if (latestResolved !== null) {
    return {
      ...base,
      phase: "resolved",
      attackRoll: effectiveAttackRoll,
      saveRoll: latestResolved.saveRoll,
      outcome: latestResolved.outcome,
      damageInflicted: latestResolved.damageInflicted,
    };
  }

  const latestSaveRolled = game.getLatestEventAfter(latestAttackRolled, SaveDiceRolledEvent);
  if (latestSaveRolled !== null) {
    return {
      ...base,
      phase: "save-rolled",
      attackRoll: effectiveAttackRoll,
      saveRoll: latestSaveRolled.saveRoll,
      outcome: null,
      damageInflicted: 0,
    };
  }

  return {
    ...base,
    phase: "attack-rolled",
    attackRoll: effectiveAttackRoll,
    saveRoll: [],
    outcome: null,
    damageInflicted: 0,
  };
}
