import { describe, it, expect } from "vitest";
import {
  ChargeAction,
  CombatActionService,
  ConfirmCombatAction,
  GameActionKind,
  GameRecordKind,
  MoveAction,
  PassAction,
} from "../index";
import { AttackDiceRolledEvent, FighterMovedEvent } from "../events";
import {
  attackBlanks,
  createGameInActionStep,
  expectFirstLegalActionOfType,
  findEvents,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// ChargeAction — exemplar for the action layer.
// ---------------------------------------------------------------------------
// Charge is chosen as the exemplar action because it exercises the most
// surface: movement + combat start + event emission + token state.
//
// PATTERN: each test spins up a fresh scenario via createGameInActionStep,
// picks a legal action via the service, applies it via engine, and asserts
// on emitted events + game state. Never mock the engine.
//
// NOTE on dice determinism: save dice are rolled randomly inside
// applyConfirmCombatAction (game engine does not accept a scripted save
// roll — the `saveRoll` field on ChargeAction is unused). Tests that need
// a deterministic outcome therefore engineer scenarios where attack dice
// alone decide the result, e.g. all-blank attack rolls (guaranteed miss
// regardless of defender saves).
// ---------------------------------------------------------------------------

describe("ChargeAction eligibility", () => {
  it("offers legal charges at the start of the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const charges = getLegalActionsOfType(service, game, "player:one", ChargeAction);

    // Setup Practice warband has 4 fighters with various weapon ranges; at
    // least one legal charge must exist against an enemy fighter on the
    // standard embergard1 board.
    expect(charges.length).toBeGreaterThan(0);
    for (const charge of charges) {
      expect(charge.playerId).toBe("player:one");
      expect(charge.path.length).toBeGreaterThan(0);
    }
  });

  it("produces no legal charges after a core ability has been used", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // Any core ability use (charge, move, attack, guard, focus) consumes
    // the action step. Use a simple move.
    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);
    engine.applyGameAction(game, move);

    const chargesAfter = getLegalActionsOfType(service, game, "player:one", ChargeAction);
    expect(chargesAfter).toEqual([]);
  });

  it("produces no legal charges for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const chargesForOpponent = getLegalActionsOfType(service, game, "player:two", ChargeAction);
    expect(chargesForOpponent).toEqual([]);
  });
});

describe("ChargeAction resolution", () => {
  it("moves the attacker to the destination hex and emits FighterMovedEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);

    // Use all-blank attack dice — combat outcome is Failure regardless of
    // defender save dice. Weapon has 2 attack dice.
    const deterministicCharge = new ChargeAction(
      charge.playerId,
      charge.fighterId,
      charge.path,
      charge.targetId,
      charge.weaponId,
      charge.selectedAbility,
      attackBlanks(2),
      null,
    );

    const destinationHexId = charge.path[charge.path.length - 1];
    engine.applyGameAction(game, deterministicCharge);

    // Fighter moved to the charge destination.
    const fighter = game.getFighter(charge.fighterId);
    expect(fighter?.currentHexId).toBe(destinationHexId);
    expect(fighter?.hasChargeToken).toBe(true);

    // Exactly one movement event was emitted by the charge.
    const moves = findEvents(game, FighterMovedEvent);
    expect(moves).toHaveLength(1);
    expect(moves[0].toHexId).toBe(destinationHexId);
    expect(moves[0].actionKind).toBe(GameActionKind.Charge);
  });

  it("emits an AttackDiceRolledEvent carrying the scripted attack roll", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    const scriptedRoll = attackBlanks(2);

    engine.applyGameAction(
      game,
      new ChargeAction(
        charge.playerId,
        charge.fighterId,
        charge.path,
        charge.targetId,
        charge.weaponId,
        charge.selectedAbility,
        scriptedRoll,
        null,
      ),
    );

    const attackRolled = findLatestEvent(game, AttackDiceRolledEvent);
    expect(attackRolled).not.toBeNull();
    expect(attackRolled!.attackRoll).toEqual(scriptedRoll);
    expect(attackRolled!.actionKind).toBe(GameActionKind.Charge);
  });

  it("records one Combat resolution after the 3-step confirm sequence", () => {
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

    // Three confirm actions: attack-rolled → save-rolled → resolved → apply.
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));

    const combatRecords = game.getEventHistory(GameRecordKind.Combat);
    expect(combatRecords).toHaveLength(1);

    // With a guaranteed miss, the target should be undamaged.
    const target = game.getFighter(charge.targetId);
    expect(target?.damage).toBe(0);
    expect(target?.isSlain).toBe(false);
  });

  it("rejects an illegal charge (wrong player)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);

    // Same charge params, but attributed to the non-active player.
    const illegalCharge = new ChargeAction(
      "player:two",
      charge.fighterId,
      charge.path,
      charge.targetId,
      charge.weaponId,
    );

    expect(() => engine.applyGameAction(game, illegalCharge)).toThrow();
  });

  it("keeps the charge-token on the fighter after combat resolves", () => {
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

    const fighter = game.getFighter(charge.fighterId);
    expect(fighter?.hasChargeToken).toBe(true);

    // Charge uses up the action step — pass should NOT be legal here; the
    // only remaining action is EndActionStep.
    const passes = service
      .getLegalActions(game, "player:one")
      .filter((a) => a instanceof PassAction);
    expect(passes).toEqual([]);
  });
});
