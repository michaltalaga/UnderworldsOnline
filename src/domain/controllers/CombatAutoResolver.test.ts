import { describe, it, expect } from "vitest";
import {
  CombatAutoResolver,
  type CombatController,
  DumbAiController,
  GameAction,
  LocalPlayerController,
  PassAction,
  Phase,
} from "../index";
import { createGameInActionStep } from "../../test-utils";
import type { PlayerId } from "../values/ids";

// ---------------------------------------------------------------------------
// CombatAutoResolver — exemplar for the controller layer.
// ---------------------------------------------------------------------------
// CombatAutoResolver is the "what do we do next" brain: given the
// active player's controller, it either asks the AI for an action,
// deterministically drains end phase steps, or returns false so the
// UI can drive the human's turn.
//
// Tests here assert the *control flow* — when does isHumanTurn return
// true, which path does resolveAutomaticStep take, does drainAll
// actually terminate. The actual legality of chosen actions is the
// engine's concern (covered elsewhere).
// ---------------------------------------------------------------------------

// A controller that always passes — deterministic, cheap, zero
// randomness. Useful for tests that want to drive the auto-resolver
// without depending on DumbAi's RNG.
class AlwaysPassController implements CombatController {
  public readonly kind = "dumb-ai" as const;

  public chooseAction(
    _game: unknown,
    legalActions: readonly GameAction[],
  ): GameAction | null {
    const pass = legalActions.find((a) => a instanceof PassAction);
    return pass ?? null;
  }
}

function controllerMap(
  one: CombatController,
  two: CombatController,
): ReadonlyMap<PlayerId, CombatController> {
  return new Map<PlayerId, CombatController>([
    ["player:one", one],
    ["player:two", two],
  ]);
}

describe("CombatAutoResolver.isHumanTurn", () => {
  it("is true when the active player is a local controller", () => {
    const { game } = createGameInActionStep("player:one");
    const resolver = new CombatAutoResolver(
      controllerMap(new LocalPlayerController(), new AlwaysPassController()),
      "player:one",
    );

    expect(resolver.isHumanTurn(game)).toBe(true);
  });

  it("is false when the active player is an AI controller", () => {
    const { game } = createGameInActionStep("player:one");
    const resolver = new CombatAutoResolver(
      controllerMap(new AlwaysPassController(), new LocalPlayerController()),
      "player:two",
    );

    expect(resolver.isHumanTurn(game)).toBe(false);
  });

  it("is true when there is no active player (transitional state)", () => {
    const { game } = createGameInActionStep("player:one");
    // Force the game into a state with no active player — the resolver
    // must not try to look up a missing controller. Use `unknown` bridge
    // to bypass the private flowState modifier (tests legitimately
    // poke state that production code routes through transitionTo).
    (game as unknown as { flowState: unknown }).flowState = {
      kind: "combatReady",
      phase: Phase.Combat,
      setupStep: null,
      turnStep: null,
      endPhaseStep: null,
      activePlayerId: null,
      firstPlayerId: null,
      priorityPlayerId: null,
    };

    const resolver = new CombatAutoResolver(
      controllerMap(new AlwaysPassController(), new AlwaysPassController()),
      "player:one",
    );
    expect(resolver.isHumanTurn(game)).toBe(true);
  });
});

describe("CombatAutoResolver.resolveAutomaticStep", () => {
  it("returns false (no work) when the active seat is a human", () => {
    const { game } = createGameInActionStep("player:one");
    const resolver = new CombatAutoResolver(
      controllerMap(new LocalPlayerController(), new AlwaysPassController()),
      "player:one",
    );

    expect(resolver.resolveAutomaticStep(game)).toBe(false);
    // State unchanged.
    expect(game.turnStep).toBe("action");
    expect(game.activePlayerId).toBe("player:one");
  });

  it("advances the game when the active seat is an AI controller", () => {
    const { game } = createGameInActionStep("player:one");
    const resolver = new CombatAutoResolver(
      controllerMap(new AlwaysPassController(), new LocalPlayerController()),
      "player:two",
    );

    const stateBefore = game.turnStep;
    const advanced = resolver.resolveAutomaticStep(game);

    expect(advanced).toBe(true);
    // AlwaysPass turned the action step into the power step.
    expect(stateBefore).toBe("action");
    expect(game.turnStep).toBe("power");
  });
});

describe("CombatAutoResolver.drainAll", () => {
  it("runs every auto step until a human is due (both AI)", () => {
    const { game } = createGameInActionStep("player:one");
    const resolver = new CombatAutoResolver(
      controllerMap(new AlwaysPassController(), new AlwaysPassController()),
      "player:one",
    );

    // With both players as AlwaysPass controllers, drainAll will burn
    // round 1, walk the end phase, and enter round 2 via the built-in
    // combatReady → startCombatRound path. Eventually it terminates.
    resolver.drainAll(game);

    // After draining, the game has advanced well past round 1.
    expect(game.roundNumber).toBeGreaterThan(1);
  });

  it("stops immediately when the active player is a human", () => {
    const { game } = createGameInActionStep("player:one");
    const resolver = new CombatAutoResolver(
      controllerMap(new LocalPlayerController(), new AlwaysPassController()),
      "player:one",
    );

    const turnsBefore = game.getPlayer("player:one")!.turnsTakenThisRound;
    resolver.drainAll(game);
    const turnsAfter = game.getPlayer("player:one")!.turnsTakenThisRound;

    // No progress was made — local player holds the turn.
    expect(turnsAfter).toBe(turnsBefore);
    expect(game.activePlayerId).toBe("player:one");
  });
});

describe("DumbAiController", () => {
  it("returns null when there are no legal actions", () => {
    const ai = new DumbAiController();
    expect(ai.chooseAction({} as never, [])).toBeNull();
  });

  it("picks an action when there is at least one legal one", () => {
    const { game } = createGameInActionStep("player:one");
    const ai = new DumbAiController();

    // Any single-element list — the AI should echo it back.
    const pass = new PassAction(game.getPlayer("player:one")!);
    expect(ai.chooseAction(game, [pass])).toBe(pass);
  });
});
