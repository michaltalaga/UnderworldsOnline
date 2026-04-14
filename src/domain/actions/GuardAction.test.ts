import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  GameActionKind,
  GameRecordKind,
  GuardAction,
  PassAction,
} from "../index";
import { FighterGuardedEvent } from "../events";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// GuardAction — action-layer coverage. Guard is the trivial core ability:
// no path, no dice, just sets a flag on the fighter.
// ---------------------------------------------------------------------------

describe("GuardAction eligibility", () => {
  it("is legal at the start of the action step for every guardable fighter", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const guards = getLegalActionsOfType(service, game, "player:one", GuardAction);

    expect(guards.length).toBeGreaterThan(0);
    for (const guard of guards) {
      expect(guard.player.id).toBe("player:one");
      const fighter = game.getFighter(guard.fighter.id)!;
      expect(fighter.hasGuardToken).toBe(false);
    }
  });

  it("is not legal for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const guardsForOpponent = getLegalActionsOfType(
      service,
      game,
      "player:two",
      GuardAction,
    );
    expect(guardsForOpponent).toEqual([]);
  });

  it("is not legal for a fighter that already has a guard token", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const [first, ...rest] = getLegalActionsOfType(
      service,
      game,
      "player:one",
      GuardAction,
    );
    expect(first).toBeDefined();

    // Manually set the guard token on the first eligible fighter and
    // re-query: the guard for that fighter should have dropped.
    game.getFighter(first.fighter.id)!.hasGuardToken = true;

    const afterIds = getLegalActionsOfType(
      service,
      game,
      "player:one",
      GuardAction,
    ).map((g) => g.fighter.id);

    expect(afterIds).not.toContain(first.fighter.id);
    // Other fighters still have legal guards.
    for (const other of rest) {
      expect(afterIds).toContain(other.fighter.id);
    }
  });
});

describe("GuardAction resolution", () => {
  it("sets the fighter's guard token and emits FighterGuardedEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);

    engine.applyGameAction(game, guard);

    const fighter = game.getFighter(guard.fighter.id)!;
    expect(fighter.hasGuardToken).toBe(true);

    const guarded = findLatestEvent(game, FighterGuardedEvent);
    expect(guarded).not.toBeNull();
    expect(guarded!.fighter).toBe(fighter);
    expect(guarded!.actionKind).toBe(GameActionKind.Guard);
  });

  it("records a Guard resolution attributed to the acting player", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);

    engine.applyGameAction(game, guard);

    const records = game.getEventHistory(GameRecordKind.Guard);
    expect(records).toHaveLength(1);
    expect(records[0].invokedByPlayer?.id).toBe("player:one");
    expect(records[0].invokedByFighter?.id).toBe(guard.fighter.id);
  });

  it("consumes the action step — no further moves are legal afterwards", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);

    engine.applyGameAction(game, guard);

    const guardsAfter = getLegalActionsOfType(service, game, "player:one", GuardAction);
    expect(guardsAfter).toEqual([]);

    // Pass should also no longer be legal — only EndActionStep.
    const passesAfter = service
      .getLegalActions(game, "player:one")
      .filter((a) => a instanceof PassAction);
    expect(passesAfter).toEqual([]);
  });

  it("rejects a guard from the wrong player", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);

    const illegal = new GuardAction(game.getPlayer("player:two")!, guard.fighter);
    expect(() => engine.applyGameAction(game, illegal)).toThrow();
  });
});
