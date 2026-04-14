import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  EndActionStepAction,
  GameActionKind,
  GameRecordKind,
  GuardAction,
  TurnStep,
} from "../index";
import {
  ActionStepEndedEvent,
  TurnStepChangedEvent,
} from "../events";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// EndActionStepAction — only legal AFTER a core ability has been used
// this action step.  It's the action that flips Action → Power without
// yielding priority (contrast with PassAction which transitions between
// steps but also counts toward round-end).
// ---------------------------------------------------------------------------

describe("EndActionStepAction eligibility", () => {
  it("is NOT legal at the start of the action step (no core ability used yet)", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const ends = getLegalActionsOfType(
      service,
      game,
      "player:one",
      EndActionStepAction,
    );
    expect(ends).toEqual([]);
  });

  it("is legal after a core ability (e.g. Guard) has been used", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    const ends = getLegalActionsOfType(
      service,
      game,
      "player:one",
      EndActionStepAction,
    );
    expect(ends).toHaveLength(1);
    expect(ends[0].playerId).toBe("player:one");
  });

  it("is not legal for the inactive player", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    const endsForOpponent = getLegalActionsOfType(
      service,
      game,
      "player:two",
      EndActionStepAction,
    );
    expect(endsForOpponent).toEqual([]);
  });
});

describe("EndActionStepAction resolution", () => {
  it("transitions from Action step to Power step (same player keeps priority)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    const end = expectFirstLegalActionOfType(
      service,
      game,
      "player:one",
      EndActionStepAction,
    );
    engine.applyGameAction(game, end);

    expect(game.turnStep).toBe(TurnStep.Power);
    expect(game.activePlayerId).toBe("player:one");
  });

  it("emits ActionStepEndedEvent and TurnStepChangedEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    const end = expectFirstLegalActionOfType(
      service,
      game,
      "player:one",
      EndActionStepAction,
    );
    engine.applyGameAction(game, end);

    expect(findLatestEvent(game, ActionStepEndedEvent)).not.toBeNull();
    expect(findLatestEvent(game, TurnStepChangedEvent)).not.toBeNull();
  });

  it("records an ActionStepEnded resolution with the EndActionStep action kind", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    const end = expectFirstLegalActionOfType(
      service,
      game,
      "player:one",
      EndActionStepAction,
    );
    engine.applyGameAction(game, end);

    const records = game.getEventHistory(GameRecordKind.ActionStepEnded);
    expect(records.length).toBeGreaterThan(0);
    const latest = records[records.length - 1];
    expect(latest.actionKind).toBe(GameActionKind.EndActionStep);
  });

  it("rejects an end-action-step from the wrong player", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    expect(() =>
      engine.applyGameAction(game, new EndActionStepAction("player:two")),
    ).toThrow();
  });
});
