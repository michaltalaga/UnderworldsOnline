import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  GameActionKind,
  GameRecordKind,
  MoveAction,
  PassAction,
} from "../index";
import { FighterMovedEvent } from "../events";
import {
  createGameInActionStep,
  expectFirstLegalActionOfType,
  findEvents,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// MoveAction — action-layer coverage following the ChargeAction exemplar.
// ---------------------------------------------------------------------------
// MoveAction is the simplest core ability: a fighter walks a path of
// traversable hexes and ends the action step. No dice, no combat.
// ---------------------------------------------------------------------------

describe("MoveAction eligibility", () => {
  it("offers legal moves at the start of the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const moves = getLegalActionsOfType(service, game, "player:one", MoveAction);

    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) {
      expect(move.player.id).toBe("player:one");
      expect(move.path.length).toBeGreaterThan(0);
    }
  });

  it("produces no legal moves after a core ability has been used", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    // Pass burns the action step without using a core ability, but the
    // next step is Power — so MoveAction should also disappear.
    engine.applyGameAction(game, new PassAction(game.players[0]));

    const movesAfter = getLegalActionsOfType(service, game, "player:one", MoveAction);
    expect(movesAfter).toEqual([]);
  });

  it("produces no legal moves for the inactive player", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const movesForOpponent = getLegalActionsOfType(service, game, "player:two", MoveAction);
    expect(movesForOpponent).toEqual([]);
  });
});

describe("MoveAction resolution", () => {
  it("moves the fighter to the destination hex and emits FighterMovedEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);
    const destinationHexId = move.path[move.path.length - 1];
    const fromHexId = game.getFighter(move.fighter.id)!.currentHex?.id ?? null;

    engine.applyGameAction(game, move);

    const fighter = game.getFighter(move.fighter.id);
    expect(fighter?.currentHex?.id).toBe(destinationHexId);
    expect(fighter?.hasMoveToken).toBe(true);

    const moved = findLatestEvent(game, FighterMovedEvent);
    expect(moved).not.toBeNull();
    expect(moved!.fromHexId).toBe(fromHexId);
    expect(moved!.toHexId).toBe(destinationHexId);
    expect(moved!.actionKind).toBe(GameActionKind.Move);
  });

  it("records a Move resolution tagged with the Move action kind", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);

    engine.applyGameAction(game, move);

    const moves = findEvents(game, FighterMovedEvent);
    expect(moves).toHaveLength(1);

    const records = game.getEventHistory(GameRecordKind.Move);
    expect(records).toHaveLength(1);
    expect(records[0].invokedByPlayer?.id).toBe("player:one");
    expect(records[0].invokedByFighter?.id).toBe(move.fighter.id);
  });

  it("rejects a move with a non-adjacent path", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);

    // Replace the path with a single random hex id that isn't adjacent
    // to the fighter's current position.  Use a clearly non-existent id
    // to force the legality check to fail.
    const illegalMove = new MoveAction(move.player, move.fighter, ["hex:not-a-real-hex" as never]);

    expect(() => engine.applyGameAction(game, illegalMove)).toThrow();
  });

  it("rejects a move from the wrong player", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const move = expectFirstLegalActionOfType(service, game, "player:one", MoveAction);

    const illegalMove = new MoveAction(game.players[1], move.fighter, move.path);
    expect(() => engine.applyGameAction(game, illegalMove)).toThrow();
  });
});
