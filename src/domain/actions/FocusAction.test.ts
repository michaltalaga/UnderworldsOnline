import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  FocusAction,
  GameActionKind,
  GameRecordKind,
  PassAction,
} from "../index";
import { FighterFocusedEvent } from "../events";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// Written as a copy-paste-from-exemplars sanity check. Follows the
// ChargeAction.test.ts pattern verbatim.

describe("FocusAction eligibility", () => {
  it("is legal at the start of the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const focuses = getLegalActionsOfType(service, game, "player:one", FocusAction);
    expect(focuses.length).toBeGreaterThan(0);
    expect(focuses[0].player.id).toBe("player:one");
  });

  it("is not legal after another core ability has been used", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    engine.applyGameAction(game, new PassAction(game.getPlayer("player:one")!));

    const focusesAfter = getLegalActionsOfType(service, game, "player:one", FocusAction);
    expect(focusesAfter).toEqual([]);
  });
});

describe("FocusAction resolution", () => {
  it("emits FighterFocusedEvent with the correct action kind", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const focus = expectFirstLegalActionOfType(service, game, "player:one", FocusAction);

    engine.applyGameAction(game, focus);

    const focused = findLatestEvent(game, FighterFocusedEvent);
    expect(focused).not.toBeNull();
    expect(focused!.actionKind).toBe(GameActionKind.Focus);
  });

  it("records a Focus resolution", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const focus = expectFirstLegalActionOfType(service, game, "player:one", FocusAction);

    engine.applyGameAction(game, focus);

    const records = game.getEventHistory(GameRecordKind.Focus);
    expect(records).toHaveLength(1);
    expect(records[0].invokedByPlayer?.id).toBe("player:one");
  });
});
