import { describe, it, expect } from "vitest";
import {
  ChargeAction,
  CombatActionService,
  ConfirmCombatAction,
  GameRecordKind,
} from "../index";
import {
  AttackDiceRolledEvent,
  CombatResolvedEvent,
  SaveDiceRolledEvent,
} from "../events";
import { getActiveCombatState } from "../rules/CombatStateProjection";
import {
  attackBlanks,
  createGameInActionStep,
  expectFirstLegalActionOfType,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// ConfirmCombatAction — advances a pending combat through its three
// phases: attack-rolled → save-rolled → resolved → (applied, combat
// cleared). Driven by ChargeAction to set up the active combat state.
// ---------------------------------------------------------------------------

describe("ConfirmCombatAction eligibility", () => {
  it("is not legal when no combat is active", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const confirms = getLegalActionsOfType(
      service,
      game,
      "player:one",
      ConfirmCombatAction,
    );
    expect(confirms).toEqual([]);
  });

  it("is legal only for the attacker while combat is active", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);

    engine.applyGameAction(
      game,
      new ChargeAction(
        charge.playerId,
        charge.fighterId,
        charge.path,
        charge.targetId,
        charge.weaponId,
        charge.selectedAbility,
        attackBlanks(2),
        null,
      ),
    );

    expect(getActiveCombatState(game)).not.toBeNull();

    const attackerConfirms = getLegalActionsOfType(
      service,
      game,
      "player:one",
      ConfirmCombatAction,
    );
    expect(attackerConfirms).toHaveLength(1);

    const defenderConfirms = getLegalActionsOfType(
      service,
      game,
      "player:two",
      ConfirmCombatAction,
    );
    expect(defenderConfirms).toEqual([]);
  });
});

describe("ConfirmCombatAction resolution sequence", () => {
  it("walks attack-rolled → save-rolled → resolved, emitting one event per step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);

    engine.applyGameAction(
      game,
      new ChargeAction(
        charge.playerId,
        charge.fighterId,
        charge.path,
        charge.targetId,
        charge.weaponId,
        charge.selectedAbility,
        attackBlanks(2),
        null,
      ),
    );

    // Phase 1: attack-rolled already emitted by Charge.
    expect(findLatestEvent(game, AttackDiceRolledEvent)).not.toBeNull();
    expect(findLatestEvent(game, SaveDiceRolledEvent)).toBeNull();

    // Phase 2: first confirm emits SaveDiceRolledEvent.
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    expect(findLatestEvent(game, SaveDiceRolledEvent)).not.toBeNull();
    expect(findLatestEvent(game, CombatResolvedEvent)).toBeNull();

    // Phase 3: second confirm emits CombatResolvedEvent.
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    expect(findLatestEvent(game, CombatResolvedEvent)).not.toBeNull();

    // Phase 4 (apply damage + end combat): third confirm closes the combat.
    expect(getActiveCombatState(game)).not.toBeNull();
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    expect(getActiveCombatState(game)).toBeNull();
  });

  it("records exactly one Combat resolution after the confirm sequence", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);

    engine.applyGameAction(
      game,
      new ChargeAction(
        charge.playerId,
        charge.fighterId,
        charge.path,
        charge.targetId,
        charge.weaponId,
        charge.selectedAbility,
        attackBlanks(2),
        null,
      ),
    );
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));

    expect(game.getEventHistory(GameRecordKind.Combat)).toHaveLength(1);
  });

  it("throws when confirming without an active combat", () => {
    const { game, engine } = createGameInActionStep("player:one");

    expect(() =>
      engine.applyGameAction(game, new ConfirmCombatAction("player:one")),
    ).toThrow();
  });
});
