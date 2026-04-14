import { describe, it, expect } from "vitest";
import {
  AttackDieFace,
  ChargeAction,
  CombatActionService,
  ConfirmCombatAction,
  PassAction,
  SaveDieFace,
  TurnStep,
} from "../index";
import { getActiveCombatState } from "../rules/CombatStateProjection";
import { createGameInActionStep } from "../../test-utils/combatGame";

describe("PassAction eligibility", () => {
  it("is legal at the start of the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    expect(game.turnStep).toBe(TurnStep.Action);

    const actions = service.getLegalActions(game, "player:one");
    const pass = actions.find((a) => a instanceof PassAction);

    expect(pass).toBeDefined();
  });

  it("is legal at the start of the power step after ending the action step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // End action step to transition to power step (without using a core ability -- just pass first)
    engine.applyGameAction(game, new PassAction("player:one"));
    expect(game.turnStep).toBe(TurnStep.Power);

    const actions = service.getLegalActions(game, "player:one");
    const pass = actions.find((a) => a instanceof PassAction);

    expect(pass).toBeDefined();
  });

  it("is legal in the power step even after the player passes the action step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // Pass action step → transitions to power step for same player
    engine.applyGameAction(game, new PassAction("player:one"));

    expect(game.turnStep).toBe(TurnStep.Power);
    expect(game.activePlayerId).toBe("player:one");

    const actions = service.getLegalActions(game, "player:one");
    const pass = actions.find((a) => a instanceof PassAction);

    expect(pass, "Pass should be legal in the power step").toBeDefined();
  });

  it("applying PassAction in the power step advances the turn", () => {
    const { game, engine } = createGameInActionStep("player:one");

    // Pass action → power step
    engine.applyGameAction(game, new PassAction("player:one"));
    expect(game.turnStep).toBe(TurnStep.Power);

    // Pass power step → next player's turn starts
    engine.applyGameAction(game, new PassAction("player:one"));

    // After passing power step: turn passes to the other player
    expect(game.activePlayerId).toBe("player:two");
    expect(game.turnStep).toBe(TurnStep.Action);
  });

  it("is legal in the power step that follows a combat", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // Use the first legal charge action to trigger combat
    const preChargeActions = service.getLegalActions(game, "player:one");
    const chargeActions = preChargeActions.filter(
      (a): a is ChargeAction => a instanceof ChargeAction,
    );
    expect(chargeActions.length, "expected at least one legal charge").toBeGreaterThan(0);
    const firstCharge = chargeActions[0];

    // Build a deterministic charge with attack roll of 2 blanks (weapon has 2 dice)
    // and a save roll of 1 success
    engine.applyGameAction(
      game,
      new ChargeAction(
        firstCharge.playerId,
        firstCharge.fighterId,
        firstCharge.path,
        firstCharge.targetId,
        firstCharge.weaponId,
        firstCharge.selectedAbility,
        [AttackDieFace.Blank, AttackDieFace.Blank],
        [SaveDieFace.Shield],
      ),
    );

    // Walk through all three confirm-combat phases
    expect(getActiveCombatState(game), "combat active after charge").not.toBeNull();
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    engine.applyGameAction(game, new ConfirmCombatAction("player:one"));
    expect(getActiveCombatState(game), "combat finished").toBeNull();

    // End action step → power step (EndActionStepAction is what's legal after using a core ability)
    const postCombatActions = service.getLegalActions(game, "player:one");
    const endAction = postCombatActions.find((a) => a.kind === "endActionStep");
    expect(endAction, "EndActionStep should be legal after combat").toBeDefined();
    engine.applyGameAction(game, endAction!);

    expect(game.turnStep).toBe(TurnStep.Power);
    expect(game.activePlayerId).toBe("player:one");

    // THE BUG: Can player one pass their power step after combat?
    const powerStepActions = service.getLegalActions(game, "player:one");
    const pass = powerStepActions.find((a) => a instanceof PassAction);

    expect(
      pass,
      "Pass should be legal in the power step that follows a combat",
    ).toBeDefined();
  });
});
