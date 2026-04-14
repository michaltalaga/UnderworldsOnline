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
    const player = game.players[0];

    const actions = ability.getLegalActions(game, player);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toBeInstanceOf(FocusAction);
  });

  it("returns no actions for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    const opponent = game.players[1];
    expect(ability.getLegalActions(game, opponent)).toEqual([]);
  });

  it("returns no actions in the power step", () => {
    const { game } = createGameInPowerStep("player:one");
    const ability = new FocusAbility();
    const player = game.players[0];

    expect(ability.getLegalActions(game, player)).toEqual([]);
  });
});

describe("FocusAbility.isLegalAction", () => {
  it("accepts an empty FocusAction", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    expect(ability.isLegalAction(game, new FocusAction(game.players[0]))).toBe(true);
  });

  it("accepts a FocusAction that references real cards in hand", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();
    const player = game.players[0];

    // Pick one card from each hand if available.
    const objCard = player.objectiveHand[0];
    const powerCard = player.powerHand[0];
    const action = new FocusAction(
      player,
      objCard !== undefined ? [objCard] : [],
      powerCard !== undefined ? [powerCard] : [],
    );
    expect(ability.isLegalAction(game, action)).toBe(true);
  });

  it("rejects a FocusAction with duplicate objective ids", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();
    const player = game.players[0];

    const card = player.objectiveHand[0];
    if (card === undefined) return; // vacuous when no cards in hand
    const action = new FocusAction(player, [card, card], []);
    expect(ability.isLegalAction(game, action)).toBe(false);
  });

  it("rejects a FocusAction with a card that isn't in the player's hand", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();
    const player = game.players[0];
    // Construct a card that belongs to a different player — it is not in this player's hand.
    const strangerPlayer = game.players[1];
    const outsideCard = strangerPlayer.objectiveHand[0];
    if (outsideCard === undefined) return;

    const action = new FocusAction(player, [outsideCard], []);
    expect(ability.isLegalAction(game, action)).toBe(false);
  });

  it("rejects a FocusAction from the wrong player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new FocusAbility();

    expect(ability.isLegalAction(game, new FocusAction(game.players[1]))).toBe(false);
  });
});
