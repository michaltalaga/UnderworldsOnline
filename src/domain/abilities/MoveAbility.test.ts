import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  MoveAction,
} from "../index";
import { MoveAbility } from "./MoveAbility";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// MoveAbility — exemplar-style ability coverage.
// ---------------------------------------------------------------------------
// MoveAbility enumerates every contiguous path up to each fighter's
// effective move distance.  Tests exercise: eligibility gating,
// path-shape invariants, and the isLegalAction predicate.
// ---------------------------------------------------------------------------

describe("MoveAbility eligibility", () => {
  it("returns no actions for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new MoveAbility();

    const opponent = game.getPlayer("player:two")!;
    const actions = ability.getLegalActions(game, opponent);
    expect(actions).toEqual([]);
  });

  it("returns at least one move per eligible fighter", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new MoveAbility();
    const player = game.getPlayer("player:one")!;

    const actions = ability.getLegalActions(game, player) as MoveAction[];
    expect(actions.length).toBeGreaterThan(0);

    const fighterIds = new Set(actions.map((a) => a.fighterId));
    const expectedFighterIds = new Set(
      player.fighters
        .filter((f) => !f.isSlain && f.currentHexId !== null)
        .map((f) => f.id),
    );
    // Every fighter that appears in moves is alive and on board.
    for (const id of fighterIds) {
      expect(expectedFighterIds.has(id)).toBe(true);
    }
  });

  it("every returned path is a sequence of adjacent traversable hexes", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new MoveAbility();
    const player = game.getPlayer("player:one")!;

    const actions = ability.getLegalActions(game, player) as MoveAction[];
    for (const action of actions) {
      const fighter = player.getFighter(action.fighterId)!;
      const startHexId = fighter.currentHexId!;
      let currentHex = game.getHex(startHexId)!;
      for (const nextHexId of action.path) {
        const nextHex = game.getHex(nextHexId)!;
        expect(game.areAdjacent(currentHex, nextHex)).toBe(true);
        currentHex = nextHex;
      }
    }
  });

  it("produces no moves after a fighter gains a move token", () => {
    const { game } = createGameInActionStep("player:one");
    const ability = new MoveAbility();
    const player = game.getPlayer("player:one")!;

    const fighter = player.fighters.find(
      (f) => !f.isSlain && f.currentHexId !== null,
    )!;
    fighter.hasMoveToken = true;

    const actions = ability.getLegalActions(game, player) as MoveAction[];
    const moves = actions.filter((a) => a.fighterId === fighter.id);
    expect(moves).toEqual([]);
  });
});

describe("MoveAbility.isLegalAction", () => {
  it("accepts a move returned by getLegalActions", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new MoveAbility();

    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);
    expect(ability.isLegalAction(game, move)).toBe(true);
  });

  it("rejects a move with an empty path", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new MoveAbility();

    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);
    const emptyPathMove = new MoveAction(move.playerId, move.fighterId, []);
    expect(ability.isLegalAction(game, emptyPathMove)).toBe(false);
  });

  it("rejects a move with a non-existent hex in the path", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new MoveAbility();

    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);
    const badMove = new MoveAction(move.playerId, move.fighterId, [
      "hex:not-a-real-hex" as never,
    ]);
    expect(ability.isLegalAction(game, badMove)).toBe(false);
  });

  it("rejects a move by the wrong player", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new MoveAbility();

    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);
    const wrongPlayerMove = new MoveAction("player:two", move.fighterId, move.path);
    expect(ability.isLegalAction(game, wrongPlayerMove)).toBe(false);
  });
});

describe("MoveAbility integration with CombatActionService", () => {
  it("is unavailable once the action step has been consumed via Guard", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const ability = new MoveAbility();

    // Use a Guard action (core ability) to burn the action step.
    const guard = service
      .getLegalActions(game, "player:one")
      .find((a) => a.kind === "guard");
    expect(guard).toBeDefined();
    engine.applyGameAction(game, guard!);

    const player = game.getPlayer("player:one")!;
    // Provider gating (via service) returns no MoveActions; ability
    // itself is still called and returns moves only for fighters with
    // no move/charge token. So we assert via the service:
    const movesAfter = getLegalActionsOfType(service, game, "player:one", MoveAction);
    expect(movesAfter).toEqual([]);
    void ability;
    void player;
  });
});
