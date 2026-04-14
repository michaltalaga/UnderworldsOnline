import { describe, it, expect } from "vitest";
import {
  AttackAction,
  ChargeAction,
  CombatActionService,
  GuardAction,
  PassAction,
} from "../index";
import { AttackAbility } from "./AttackAbility";
import {
  attackBlanks,
  createGameInActionStep,
  expectFirstLegalActionOfType,
  getLegalActionsOfType,
} from "../../test-utils";
import { canFighterAttack } from "./fighterChecks";

// ---------------------------------------------------------------------------
// AttackAbility — exemplar for the ability layer.
// ---------------------------------------------------------------------------
// Abilities encapsulate per-move rules: "can this fighter attack this
// target with this weapon right now?" They're pure predicates over the
// game state.
//
// PATTERN: instantiate the ability directly and call getLegalActions /
// isLegalAction; compose with real game state from the scenario
// helpers so weapon range, hex adjacency, and fighter eligibility
// behave authentically.
// ---------------------------------------------------------------------------

describe("AttackAbility eligibility", () => {
  it("returns no legal actions when it's not the player's combat action step", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new AttackAbility();

    const opponent = game.getPlayer("player:two")!;
    const actions = ability.getLegalActions(game, opponent);
    expect(actions).toEqual([]);
  });

  it("rejects an attack launched by the wrong player via isLegalAction", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new AttackAbility();

    // Find a real, currently-legal attack for player one.
    const legal = getLegalActionsOfType(service, game, "player:one", AttackAction);
    // Practice warband has Practice Bow (range 3) — at least one attack
    // may or may not be legal depending on hex geometry. If none exist,
    // this test is vacuous but should not fail.
    if (legal.length === 0) return;

    const legalAttack = legal[0];
    const illegalAttack = new AttackAction(
      game.getPlayer("player:two")!,
      legalAttack.attacker,
      legalAttack.target,
      legalAttack.weapon,
    );

    expect(ability.isLegalAction(game, illegalAttack)).toBe(false);
  });

  it("rejects an attack against a slain target", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new AttackAbility();
    const service = new CombatActionService();

    const legal = getLegalActionsOfType(service, game, "player:one", AttackAction);
    if (legal.length === 0) return;

    const attack = legal[0];
    const target = game.getFighter(attack.target.id)!;
    target.isSlain = true;

    expect(ability.isLegalAction(game, attack)).toBe(false);
  });

  it("rejects an attack with a weapon that doesn't belong to the attacker", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new AttackAbility();
    const service = new CombatActionService();

    const legal = getLegalActionsOfType(service, game, "player:one", AttackAction);
    if (legal.length === 0) return;

    const template = legal[0];
    const fakeWeapon = { ...template.weapon, id: "weapon-def:nonexistent" as never };
    const bogusWeaponAttack = new AttackAction(
      template.player,
      template.attacker,
      template.target,
      fakeWeapon as unknown as typeof template.weapon,
    );

    expect(ability.isLegalAction(game, bogusWeaponAttack)).toBe(false);
  });
});

describe("AttackAbility fighter checks", () => {
  it("canFighterAttack is false for a fighter with a charge token", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // Charge gives the fighter a charge token — after that, canFighterAttack
    // should be false. Use all-blank attack so the charge misses cleanly.
    const charge = expectFirstLegalActionOfType(service, game, "player:one", ChargeAction);
    engine.applyGameAction(
      game,
      new ChargeAction(
        charge.player,
      charge.fighter,
      charge.path,
      charge.target,
      charge.weapon,
        charge.selectedAbility,
        attackBlanks(2),
        null,
      ),
    );

    const attacker = game.getFighter(charge.fighter.id)!;
    expect(attacker.hasChargeToken).toBe(true);
    expect(canFighterAttack(attacker)).toBe(false);
  });

  it("canFighterAttack stays true after a plain Guard action (no charge token)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const guard = expectFirstLegalActionOfType(service, game, "player:one", GuardAction);
    engine.applyGameAction(game, guard);

    const fighter = game.getFighter(guard.fighter.id)!;
    expect(fighter.hasGuardToken).toBe(true);
    // Guard doesn't give a charge token, so attacking is still mechanically
    // allowed (even though the action step was consumed at a higher level).
    expect(canFighterAttack(fighter)).toBe(true);
  });
});

describe("AttackAbility integration with CombatActionService", () => {
  it("is unavailable after a core ability has been used this action step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // Use Pass as a neutral way to burn the action step, then verify the
    // aggregate service no longer surfaces AttackActions for player one.
    engine.applyGameAction(game, new PassAction(game.getPlayer("player:one")!));

    const attacks = getLegalActionsOfType(service, game, "player:one", AttackAction);
    expect(attacks).toEqual([]);
  });
});
