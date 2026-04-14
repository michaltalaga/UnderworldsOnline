import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  GuardAction,
} from "../index";
import { GuardAbility } from "./GuardAbility";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// GuardAbility — ability-layer coverage.  Guard is a simple filter:
// one action per guard-eligible fighter.
// ---------------------------------------------------------------------------

describe("GuardAbility eligibility", () => {
  it("returns no actions for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new GuardAbility();

    const opponent = game.players[1];
    const actions = ability.getLegalActions(game, opponent);
    expect(actions).toEqual([]);
  });

  it("returns one GuardAction per eligible friendly fighter", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new GuardAbility();
    const player = game.players[0];

    const actions = ability.getLegalActions(game, player) as GuardAction[];
    const fighterIds = actions.map((a) => a.fighter.id);
    const uniqueFighterIds = new Set(fighterIds);
    // No duplicates: one action per fighter.
    expect(uniqueFighterIds.size).toBe(fighterIds.length);

    // Every fighter in the set is alive, on board, and has no conflicting tokens.
    for (const action of actions) {
      const fighter = player.getFighter(action.fighter.id)!;
      expect(fighter.isSlain).toBe(false);
      expect(fighter.currentHex).not.toBeNull();
      expect(fighter.hasMoveToken).toBe(false);
      expect(fighter.hasChargeToken).toBe(false);
      expect(fighter.hasGuardToken).toBe(false);
    }
  });

  it("skips fighters that already have a guard token", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new GuardAbility();
    const player = game.players[0];
    const fighter = player.fighters.find(
      (f) => !f.isSlain && f.currentHex !== null,
    )!;
    fighter.hasGuardToken = true;

    const actions = ability.getLegalActions(game, player) as GuardAction[];
    expect(actions.find((a) => a.fighter === fighter)).toBeUndefined();
  });
});

describe("GuardAbility.isLegalAction", () => {
  it("accepts a guard returned by getLegalActions", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new GuardAbility();

    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    expect(ability.isLegalAction(game, guard)).toBe(true);
  });

  it("rejects a guard for a fighter that already has a guard token", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new GuardAbility();

    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    guard.fighter.hasGuardToken = true;
    expect(ability.isLegalAction(game, guard)).toBe(false);
  });

  it("rejects a guard from the wrong player", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new GuardAbility();

    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    const illegal = new GuardAction(game.players[1], guard.fighter);
    expect(ability.isLegalAction(game, illegal)).toBe(false);
  });
});
