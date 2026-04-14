import { describe, it, expect } from "vitest";
import { Fighter } from "../state/Fighter";
import { HexCell } from "../state/HexCell";
import { HexKind } from "../values/enums";
import {
  canFighterAct,
  canFighterAttack,
  canFighterGuard,
  canFighterMove,
  isTraversableMoveHex,
} from "./fighterChecks";

// ---------------------------------------------------------------------------
// fighterChecks — pure predicate coverage.  Each helper is exercised
// against a small matrix of fighter/hex states.  These functions have
// no game-state dependency so tests construct bare Fighter / HexCell
// instances.
// ---------------------------------------------------------------------------

function makeFighter(
  overrides: Partial<{
    isSlain: boolean;
    currentHexId: string | null;
    hasMoveToken: boolean;
    hasChargeToken: boolean;
    hasGuardToken: boolean;
  }> = {},
): Fighter {
  const f = new Fighter(
    "fighter:test" as never,
    "fighter-def:test" as never,
    "player:one" as never,
    "hex:a" as never,
  );
  if (overrides.isSlain !== undefined) f.isSlain = overrides.isSlain;
  if (overrides.currentHexId !== undefined) f.currentHexId = overrides.currentHexId as never;
  if (overrides.hasMoveToken !== undefined) f.hasMoveToken = overrides.hasMoveToken;
  if (overrides.hasChargeToken !== undefined) f.hasChargeToken = overrides.hasChargeToken;
  if (overrides.hasGuardToken !== undefined) f.hasGuardToken = overrides.hasGuardToken;
  return f;
}

function makeHex(
  kind: HexKind,
  occupantFighterId: string | null = null,
): HexCell {
  return new HexCell(
    "hex:test" as never,
    0,
    0,
    kind,
    false,
    false,
    null,
    occupantFighterId as never,
  );
}

describe("canFighterAct", () => {
  it("is true for an alive fighter on the board", () => {
    expect(canFighterAct(makeFighter())).toBe(true);
  });

  it("is false for a slain fighter", () => {
    expect(canFighterAct(makeFighter({ isSlain: true }))).toBe(false);
  });

  it("is false for a fighter off the board", () => {
    expect(canFighterAct(makeFighter({ currentHexId: null }))).toBe(false);
  });
});

describe("canFighterMove", () => {
  it("is true for an alive fighter with no movement tokens", () => {
    expect(canFighterMove(makeFighter())).toBe(true);
  });

  it("is false for a fighter with a move token", () => {
    expect(canFighterMove(makeFighter({ hasMoveToken: true }))).toBe(false);
  });

  it("is false for a fighter with a charge token", () => {
    expect(canFighterMove(makeFighter({ hasChargeToken: true }))).toBe(false);
  });

  it("is false for a slain fighter", () => {
    expect(canFighterMove(makeFighter({ isSlain: true }))).toBe(false);
  });
});

describe("canFighterGuard", () => {
  it("is true for a fighter who can move and has no guard token", () => {
    expect(canFighterGuard(makeFighter())).toBe(true);
  });

  it("is false for a fighter with a guard token", () => {
    expect(canFighterGuard(makeFighter({ hasGuardToken: true }))).toBe(false);
  });

  it("is false for a fighter with a move token", () => {
    expect(canFighterGuard(makeFighter({ hasMoveToken: true }))).toBe(false);
  });

  it("is false for a slain fighter", () => {
    expect(canFighterGuard(makeFighter({ isSlain: true }))).toBe(false);
  });
});

describe("canFighterAttack", () => {
  it("is true for an alive on-board fighter with no charge token", () => {
    expect(canFighterAttack(makeFighter())).toBe(true);
  });

  it("is false for a fighter with a charge token (already spent the slot)", () => {
    expect(canFighterAttack(makeFighter({ hasChargeToken: true }))).toBe(false);
  });

  it("is true for a fighter with a move token (move does not prevent attack)", () => {
    expect(canFighterAttack(makeFighter({ hasMoveToken: true }))).toBe(true);
  });

  it("is false for a slain fighter", () => {
    expect(canFighterAttack(makeFighter({ isSlain: true }))).toBe(false);
  });
});

describe("isTraversableMoveHex", () => {
  it("is true for an empty non-blocked hex", () => {
    expect(isTraversableMoveHex(makeHex(HexKind.Empty))).toBe(true);
  });

  it("is true for a stagger hex with no occupant", () => {
    expect(isTraversableMoveHex(makeHex(HexKind.Stagger))).toBe(true);
  });

  it("is false for a blocked hex", () => {
    expect(isTraversableMoveHex(makeHex(HexKind.Blocked))).toBe(false);
  });

  it("is false for an occupied hex", () => {
    expect(isTraversableMoveHex(makeHex(HexKind.Empty, "fighter:other"))).toBe(false);
  });
});
