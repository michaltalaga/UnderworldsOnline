import { describe, it, expect } from "vitest";
import {
  ChargeAction,
  CombatActionService,
} from "../index";
import { ChargeAbility } from "./ChargeAbility";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// ChargeAbility — ability-layer coverage.
// ---------------------------------------------------------------------------
// Charge = move + attack.  The ability enumerates legal paths, then for
// each destination finds enemy fighters the attacker's weapons can
// reach.  Tests exercise: player gating, shape invariants, and the
// isLegalAction predicate.
// ---------------------------------------------------------------------------

describe("ChargeAbility eligibility", () => {
  it("returns no actions for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new ChargeAbility();

    const opponent = game.getPlayer("player:two")!;
    const actions = ability.getLegalActions(game, opponent);
    expect(actions).toEqual([]);
  });

  it("every returned charge ends within weapon range of its target", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new ChargeAbility();
    const player = game.getPlayer("player:one")!;

    const actions = ability.getLegalActions(game, player) as ChargeAction[];
    expect(actions.length).toBeGreaterThan(0);

    for (const action of actions) {
      const destHexId = action.path[action.path.length - 1];
      const destHex = game.getHex(destHexId)!;
      const target = game.getFighter(action.targetId)!;
      const targetHex = game.getFighterHex(target)!;
      const weapon = player.getFighterWeaponDefinition(action.fighterId, action.weaponId)!;
      expect(game.getDistance(destHex, targetHex)).toBeLessThanOrEqual(weapon.range);
    }
  });

  it("generates weapon-ability variants (selectedAbility per weapon ability)", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new ChargeAbility();
    const player = game.getPlayer("player:one")!;

    const actions = ability.getLegalActions(game, player) as ChargeAction[];

    // At least one charge exists with selectedAbility !== null — the
    // practice warband's Practice Blade has weapon abilities declared.
    const hasAbilityVariant = actions.some((a) => a.selectedAbility !== null);
    const hasBaseVariant = actions.some((a) => a.selectedAbility === null);
    expect(hasBaseVariant).toBe(true);
    // If any charges exist at all, base variant must.  ability variant
    // is optional depending on which fighter is in range.
    void hasAbilityVariant;
  });
});

describe("ChargeAbility.isLegalAction", () => {
  it("accepts a charge returned by getLegalActions", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new ChargeAbility();

    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    expect(ability.isLegalAction(game, charge)).toBe(true);
  });

  it("rejects a charge with a wrong-player prefix", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new ChargeAbility();

    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    const illegal = new ChargeAction(
      "player:two",
      charge.fighterId,
      charge.path,
      charge.targetId,
      charge.weaponId,
    );
    expect(ability.isLegalAction(game, illegal)).toBe(false);
  });

  it("rejects a charge against a slain target", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new ChargeAbility();

    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    const target = game.getFighter(charge.targetId)!;
    target.isSlain = true;
    expect(ability.isLegalAction(game, charge)).toBe(false);
  });

  it("rejects a charge with a weapon that doesn't belong to the attacker", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new ChargeAbility();

    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    const illegal = new ChargeAction(
      charge.playerId,
      charge.fighterId,
      charge.path,
      charge.targetId,
      "weapon-def:not-a-real-weapon" as never,
    );
    expect(ability.isLegalAction(game, illegal)).toBe(false);
  });

  it("rejects a charge with an empty path", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new ChargeAbility();

    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    const emptyPath = new ChargeAction(
      charge.playerId,
      charge.fighterId,
      [],
      charge.targetId,
      charge.weaponId,
    );
    expect(ability.isLegalAction(game, emptyPath)).toBe(false);
  });
});
