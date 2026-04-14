import { describe, it, expect } from "vitest";
import {
  CardZone,
  Fighter,
  PassAction,
  PlayPloyAction,
  PloyCard,
  UpgradeCard,
} from "../../index";
import { createGameInActionStep } from "../../../test-utils";
import {
  GiveGuardPloy,
  GiveStaggerPloy,
  PracticeObjective01,
  PracticeObjectiveGeneric,
  PracticeUpgrade,
} from "./SetupPracticeCards";

// ---------------------------------------------------------------------------
// Card layer exemplars — one per card type.
// ---------------------------------------------------------------------------
// Objective, ploy, and upgrade cards each have different timing and
// persistence shapes, so the test patterns diverge by kind:
//
//   - Objective  → getLegalTargets() returns the owner during a valid
//                  scoring window; subclasses override canScore().
//   - Ploy       → getLegalTargets() is the main API; onPlay(target)
//                  applies the effect. Tested via PlayPloyAction end-to-end
//                  to verify that state mutations land.
//   - Upgrade    → getLegalTargets() returns fighters; passive-effect
//                  hook methods declare modifiers (getAttackDiceBonus,
//                  shouldIgnoreSaveKeyword, etc.) and default to no-ops.
//
// All three test groups share the same pattern: build a real game,
// construct the card with real owner+zone references, inspect the card.
// No mocks — cards read live game state.
// ---------------------------------------------------------------------------

describe("PracticeObjective01 — objective card exemplar", () => {
  it("returns no legal targets when not in hand", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    // Construct in the deck zone (not the hand) — the objective cannot
    // be scored from there.
    const card = new PracticeObjective01("obj-01-test", owner, CardZone.ObjectiveDeck);

    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("returns no legal targets during the action step with no preceding combat", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new PracticeObjective01("obj-01-test", owner, CardZone.ObjectiveHand);

    // Precondition is "latest combat event has all successes" — no
    // combat has happened yet, so the card is not scorable.
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("the generic end-phase objective only scores during the end phase", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const generic = new PracticeObjectiveGeneric("obj-gen", owner, CardZone.ObjectiveHand, "05");

    expect(game.phase).toBe("combat");
    expect(generic.getLegalTargets(game)).toEqual([]);
  });
});

describe("GiveGuardPloy — ploy card exemplar", () => {
  it("is not playable during the action step (power step only)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const ploy = new GiveGuardPloy("ploy-guard", owner, CardZone.PowerHand, "99");

    expect(game.turnStep).toBe("action");
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("targets only friendly fighters without a Guard token during the power step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    // Now in the power step.

    const owner = game.players[0];
    const ploy = new GiveGuardPloy("ploy-guard", owner, CardZone.PowerHand, "99");

    const targets = ploy.getLegalTargets(game);
    expect(targets.length).toBeGreaterThan(0);
    // Every target is a fighter owned by player:one without a guard token.
    for (const target of targets) {
      expect("id" in target && "definition" in target).toBe(true);
      const fighter = target as { owner: { id: string }; hasGuardToken: boolean };
      expect(fighter.owner.id).toBe("player:one");
      expect(fighter.hasGuardToken).toBe(false);
    }
  });

  it("applies a guard token when played through the engine", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));

    const owner = game.players[0];
    const ploy = new GiveGuardPloy("ploy-guard", owner, CardZone.PowerHand, "99");
    owner.powerHand.push(ploy);

    const [firstTarget] = ploy.getLegalTargets(game);
    expect(firstTarget).toBeDefined();
    const targetFighter = firstTarget as Fighter;

    engine.applyGameAction(
      game,
      new PlayPloyAction(game.players[0], ploy, targetFighter),
    );

    expect(targetFighter.hasGuardToken).toBe(true);
    // The ploy moved from hand to discard and zone updated.
    expect(ploy.zone).toBe(CardZone.PowerDiscard);
    expect(owner.powerHand.includes(ploy)).toBe(false);
  });

  it("GiveStaggerPloy targets enemy fighters without stagger", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));

    const owner = game.players[0];
    const ploy = new GiveStaggerPloy("ploy-stagger", owner, CardZone.PowerHand, "99");

    const targets = ploy.getLegalTargets(game);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      const fighter = target as { owner: { id: string }; hasStaggerToken: boolean };
      expect(fighter.owner.id).toBe("player:two");
      expect(fighter.hasStaggerToken).toBe(false);
    }
  });
});

describe("PracticeUpgrade — upgrade card exemplar", () => {
  it("has no passive effects by default (base-class hooks return neutrals)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upgrade = new PracticeUpgrade("upg-01", owner, CardZone.PowerHand, "01");

    expect(upgrade.getMovementBonus()).toBe(0);
    expect(upgrade.getHealthBonus()).toBe(0);
    expect(upgrade.getSaveDiceBonus()).toBe(0);

    const weapon = owner.warband.fighters[0].weapons[0];
    expect(upgrade.getAttackDiceBonus(weapon)).toBe(0);
    expect(upgrade.getGrantedWeaponAbility(weapon, 3)).toBeNull();
  });

  it("is not playable during the action step (power step only)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upgrade = new PracticeUpgrade("upg-01", owner, CardZone.PowerHand, "01");

    expect(game.turnStep).toBe("action");
    expect(upgrade.getLegalTargets(game)).toEqual([]);
  });

  it("is not playable while the owner lacks enough glory", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));

    const owner = game.players[0];
    owner.glory = 0;
    const upgrade = new PracticeUpgrade("upg-01", owner, CardZone.PowerHand, "01");

    expect(upgrade.gloryValue).toBe(1);
    expect(upgrade.getLegalTargets(game)).toEqual([]);

    // With enough glory, the card offers legal targets.
    owner.glory = 5;
    const targets = upgrade.getLegalTargets(game);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      const fighter = target as { owner: { id: string }; isSlain: boolean };
      expect(fighter.owner.id).toBe("player:one");
      expect(fighter.isSlain).toBe(false);
    }
  });

  it("inherits from PloyCard/UpgradeCard base classes (structure check)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const ploy = new GiveGuardPloy("p", owner, CardZone.PowerHand, "01");
    const upgrade = new PracticeUpgrade("u", owner, CardZone.PowerHand, "01");

    // Runtime instanceof check — cheaper than reading imports.
    expect(ploy).toBeInstanceOf(PloyCard);
    expect(upgrade).toBeInstanceOf(UpgradeCard);
    void game;
  });
});
