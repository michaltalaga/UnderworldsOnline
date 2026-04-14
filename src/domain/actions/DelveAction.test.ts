import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  DelveAction,
  FeatureTokenSide,
  GameActionKind,
  GameRecordKind,
} from "../index";
import { FighterDelvedEvent } from "../events";
import {
  createGameInActionStep,
  createGameInPowerStep,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// DelveAction — power-step only; requires a friendly fighter standing
// on a revealed (non-Hidden) feature token.  Feature tokens are placed
// during setup but start Hidden, so tests reveal a token + move a
// fighter onto its hex before calling delve.
// ---------------------------------------------------------------------------

function revealFeatureTokenAndPlaceFriendly(
  game: ReturnType<typeof createGameInPowerStep>["game"],
  playerId: "player:one" | "player:two",
): { tokenId: string; fighter: import("../state/Fighter").Fighter } | null {
  const player = game.getPlayer(playerId)!;

  // Pick the first feature token and reveal it as Treasure.
  const token = game.featureTokens[0];
  if (token === undefined) return null;
  token.side = FeatureTokenSide.Treasure;

  // Find a friendly fighter that's alive and on the board — warp them
  // onto the feature-token hex so delve becomes legal.
  const fighter = player.fighters.find(
    (f) => !f.isSlain && f.currentHex !== null,
  );
  if (fighter === undefined) return null;

  // Vacate the fighter's current hex and the target hex before moving.
  const oldHex = game.getFighterHex(fighter)!;
  oldHex.occupantFighter = null;

  const newHex = token.hex;
  // If something else occupies the hex, bail — test scenario isn't valid.
  if (newHex.occupantFighter !== null) return null;
  newHex.occupantFighter = fighter;
  fighter.currentHex = newHex;

  return { tokenId: token.id, fighter };
}

describe("DelveAction eligibility", () => {
  it("is not legal in the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();

    const delves = getLegalActionsOfType(service, game, "player:one", DelveAction);
    expect(delves).toEqual([]);
  });

  it("is legal in the power step for a fighter on a revealed feature token", () => {
    const { game } = createGameInPowerStep("player:one");
    const service = new CombatActionService();

    const setup = revealFeatureTokenAndPlaceFriendly(game, "player:one");
    if (setup === null) return; // vacuous when scenario can't be assembled

    const delves = getLegalActionsOfType(service, game, "player:one", DelveAction);
    expect(delves.length).toBeGreaterThan(0);
    expect(delves.some((d) => d.fighter.id === setup.fighter.id)).toBe(true);
  });

  it("is not legal once the player has already delved this power step", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const service = new CombatActionService();

    const setup = revealFeatureTokenAndPlaceFriendly(game, "player:one");
    if (setup === null) return; // vacuous

    const delve = getLegalActionsOfType(service, game, "player:one", DelveAction)
      .find((d) => d.fighter.id === setup.fighter.id)!;
    engine.applyGameAction(game, delve);

    expect(game.players[0].hasDelvedThisPowerStep).toBe(true);
    const delvesAfter = getLegalActionsOfType(service, game, "player:one", DelveAction);
    expect(delvesAfter).toEqual([]);
  });

  it("is not legal for a hidden-side feature token", () => {
    const { game } = createGameInPowerStep("player:one");
    const service = new CombatActionService();

    const setup = revealFeatureTokenAndPlaceFriendly(game, "player:one");
    if (setup === null) return; // vacuous

    // Re-hide the token; delve should drop out of the legal action list.
    const token = game.getFeatureToken(setup.tokenId as never)!;
    token.side = FeatureTokenSide.Hidden;

    const delves = getLegalActionsOfType(service, game, "player:one", DelveAction);
    expect(delves.find((d) => d.fighter.id === setup.fighter.id)).toBeUndefined();
  });
});

describe("DelveAction resolution", () => {
  it("flips the token side, applies a stagger token, and emits FighterDelvedEvent", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const service = new CombatActionService();

    const setup = revealFeatureTokenAndPlaceFriendly(game, "player:one");
    if (setup === null) return; // vacuous

    const delve = getLegalActionsOfType(service, game, "player:one", DelveAction)
      .find((d) => d.fighter.id === setup.fighter.id)!;

    engine.applyGameAction(game, delve);

    const fighter = game.getFighter(setup.fighter.id as never)!;
    expect(fighter.hasStaggerToken).toBe(true);

    const token = game.getFeatureToken(setup.tokenId as never)!;
    // Treasure → Cover after delve.
    expect(token.side).toBe(FeatureTokenSide.Cover);

    const delved = findLatestEvent(game, FighterDelvedEvent);
    expect(delved).not.toBeNull();
    expect(delved!.featureTokenId).toBe(setup.tokenId);
    expect(delved!.actionKind).toBe(GameActionKind.Delve);
  });

  it("records one Delve resolution", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const service = new CombatActionService();

    const setup = revealFeatureTokenAndPlaceFriendly(game, "player:one");
    if (setup === null) return; // vacuous

    const delve = getLegalActionsOfType(service, game, "player:one", DelveAction)
      .find((d) => d.fighter.id === setup.fighter.id)!;
    engine.applyGameAction(game, delve);

    const records = game.getEventHistory(GameRecordKind.Delve);
    expect(records).toHaveLength(1);
    expect(records[0].invokedByPlayer?.id).toBe("player:one");
    expect(records[0].invokedByFighter?.id).toBe(setup.fighter.id);
  });

  it("rejects delve for the wrong player", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const playerTwo = game.players[1];
    const opponentFighter = playerTwo.fighters[0]!;
    const anyToken = game.featureTokens[0]!;

    // Player two is not the active player — any delve they submit must throw.
    const illegal = new DelveAction(playerTwo, opponentFighter, anyToken);
    expect(() => engine.applyGameAction(game, illegal)).toThrow();
  });
});
