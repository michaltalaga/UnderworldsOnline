import { describe, it, expect } from "vitest";
import { FocusAction } from "../index";
import { FocusAbility } from "./FocusAbility";
import {
  createGameInActionStep,
  createGameInPowerStep,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// FocusAbility — ability-layer coverage.
// ---------------------------------------------------------------------------
// Focus is always exactly one action per player in the action step
// (the player chooses discard sets inside the FocusAction payload).
// The ability's isLegalAction has richer constraints: unique card ids,
// every id must be present in the relevant hand.
// ---------------------------------------------------------------------------

describe("FocusAbility eligibility", () => {
  it("returns exactly one FocusAction in the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();
    const player = game.getPlayer("player:one")!;

    const actions = ability.getLegalActions(game, player);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toBeInstanceOf(FocusAction);
  });

  it("returns no actions for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    const opponent = game.getPlayer("player:two")!;
    expect(ability.getLegalActions(game, opponent)).toEqual([]);
  });

  it("returns no actions in the power step", () => {
    const { game } = createGameInPowerStep("player:one");
    const ability = new FocusAbility();
    const player = game.getPlayer("player:one")!;

    expect(ability.getLegalActions(game, player)).toEqual([]);
  });
});

describe("FocusAbility.isLegalAction", () => {
  it("accepts an empty FocusAction", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    expect(ability.isLegalAction(game, new FocusAction("player:one"))).toBe(true);
  });

  it("accepts a FocusAction that references real cards in hand", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();
    const player = game.getPlayer("player:one")!;

    // Pick one card from each hand if available.
    const objCardId = player.objectiveHand[0]?.id;
    const powerCardId = player.powerHand[0]?.id;
    const action = new FocusAction(
      "player:one",
      objCardId !== undefined ? [objCardId] : [],
      powerCardId !== undefined ? [powerCardId] : [],
    );
    expect(ability.isLegalAction(game, action)).toBe(true);
  });

  it("rejects a FocusAction with duplicate objective ids", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();
    const player = game.getPlayer("player:one")!;

    const id = player.objectiveHand[0]?.id;
    if (id === undefined) return; // vacuous when no cards in hand
    const action = new FocusAction("player:one", [id, id], []);
    expect(ability.isLegalAction(game, action)).toBe(false);
  });

  it("rejects a FocusAction with an id that isn't in the player's hand", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    const action = new FocusAction(
      "player:one",
      ["card:does-not-exist" as never],
      [],
    );
    expect(ability.isLegalAction(game, action)).toBe(false);
  });

  it("rejects a FocusAction from the wrong player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    expect(ability.isLegalAction(game, new FocusAction("player:two"))).toBe(false);
  });
});
