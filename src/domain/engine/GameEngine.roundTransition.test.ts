import { describe, it, expect } from "vitest";
import {
  EndPhaseActionService,
  EndPhaseStep,
  GameEngine,
  PassAction,
  Phase,
  TurnStep,
  deterministicFirstPlayerRollOff,
  createCombatReadySetupPracticeGame,
} from "../index";
import {
  PlayerPassedEvent,
  RoundStartedEvent,
} from "../events";
import {
  createGameInActionStep,
  findEvents,
  findLatestEvent,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// GameEngine — round-transition exemplar for the engine-flow layer.
// ---------------------------------------------------------------------------
// Scope: asserts the *orchestration* of the engine — turn-step flips,
// action↔power transitions, round-end → end-phase entry, and the
// boundary where round 1 cleanup makes way for round 2.
//
// Does NOT duplicate per-action behavior (movement, combat resolution,
// etc.) — those live in action-layer tests. Here we only verify that
// the engine wires phases together correctly.
//
// All tests drive the engine with PassAction sequences. Pass is the
// cheapest way to advance turn state without side effects.
// ---------------------------------------------------------------------------

describe("GameEngine turn-step flow", () => {
  it("a single pass transitions the action step to the power step", () => {
    const { game, engine } = createGameInActionStep("player:one");

    expect(game.turnStep).toBe(TurnStep.Action);
    expect(game.activePlayerId).toBe("player:one");

    engine.applyGameAction(game, new PassAction(game.players[0]));

    expect(game.turnStep).toBe(TurnStep.Power);
    expect(game.activePlayerId).toBe("player:one");

    const passed = findLatestEvent(game, PlayerPassedEvent);
    expect(passed).not.toBeNull();
    expect(passed!.stepPassed).toBe(TurnStep.Action);
    expect(passed!.roundEnded).toBe(false);
  });

  it("passing the power step hands the turn to the opponent (action step)", () => {
    const { game, engine } = createGameInActionStep("player:one");

    // action → power for player one
    engine.applyGameAction(game, new PassAction(game.players[0]));
    // power → opponent's action
    engine.applyGameAction(game, new PassAction(game.players[0]));

    expect(game.activePlayerId).toBe("player:two");
    expect(game.turnStep).toBe(TurnStep.Action);
  });

  it("counts turns taken as each player completes their power step", () => {
    const { game, engine } = createGameInActionStep("player:one");

    // Player one: action pass, power pass = 1 turn completed.
    engine.applyGameAction(game, new PassAction(game.players[0]));
    engine.applyGameAction(game, new PassAction(game.players[0]));

    const playerOne = game.players[0];
    expect(playerOne.turnsTakenThisRound).toBe(1);

    // Player two: same → 1 turn.
    engine.applyGameAction(game, new PassAction(game.players[1]));
    engine.applyGameAction(game, new PassAction(game.players[1]));
    const playerTwo = game.players[1];
    expect(playerTwo.turnsTakenThisRound).toBe(1);
  });
});

describe("GameEngine round-end → end-phase entry", () => {
  it("enters the end phase once both players have taken all their turns", () => {
    const { game, engine } = createGameInActionStep("player:one");

    // A round requires each player to take 4 turns (8 total,
    // alternating).  One turn = pass-action + pass-power.
    for (let t = 0; t < 8; t += 1) {
      const active = game.activePlayer!;
      engine.applyGameAction(game, new PassAction(active));
      engine.applyGameAction(game, new PassAction(active));
    }

    expect(game.phase).toBe(Phase.End);
    expect(game.endPhaseStep).toBe(EndPhaseStep.ScoreObjectives);

    // The last pass event reports that the round ended.
    const passEvents = findEvents(game, PlayerPassedEvent);
    const finalPass = passEvents[passEvents.length - 1];
    expect(finalPass.roundEnded).toBe(true);
    expect(finalPass.phaseAfterPass).toBe(Phase.End);
  });
});

describe("GameEngine round-2 setup after cleanup", () => {
  it("increments the round number and returns to combatReady after cleanup", () => {
    const { game, engine } = createGameInActionStep("player:one");
    const endPhaseService = new EndPhaseActionService();

    // Drain round 1 into the end phase.
    for (let t = 0; t < 8; t += 1) {
      const active = game.activePlayer!;
      engine.applyGameAction(game, new PassAction(active));
      engine.applyGameAction(game, new PassAction(active));
    }

    // Walk every end-phase step. Service returns exactly one legal
    // action per step; that's by design — the end phase is deterministic.
    while (game.phase === Phase.End) {
      const [action] = endPhaseService.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    expect(game.roundNumber).toBe(2);
    expect(game.isCombatReady()).toBe(true);
  });

  it("records a RoundStartedEvent per combat round", () => {
    // Start from fresh — we want to count RoundStarted events across
    // two full rounds.
    const game = createCombatReadySetupPracticeGame();
    const engine = new GameEngine();
    const endPhaseService = new EndPhaseActionService();

    engine.startCombatRound(game, [deterministicFirstPlayerRollOff], "player:one");
    expect(findEvents(game, RoundStartedEvent)).toHaveLength(1);

    // Drive round 1 to completion.
    for (let t = 0; t < 8; t += 1) {
      const active = game.activePlayer!;
      engine.applyGameAction(game, new PassAction(active));
      engine.applyGameAction(game, new PassAction(active));
    }
    while (game.phase === Phase.End) {
      const [action] = endPhaseService.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    // Start round 2.
    engine.startCombatRound(game, [deterministicFirstPlayerRollOff], "player:one");
    expect(findEvents(game, RoundStartedEvent)).toHaveLength(2);
    expect(game.roundNumber).toBe(2);
  });
});
