import {
  createCombatReadySetupPracticeGame,
  deterministicFirstPlayerRollOff,
  GameEngine,
  PassAction,
  type Game,
} from "../../domain";

/**
 * Scenario helpers — compose real engine transitions to reach a target
 * state. These are NOT hand-built fixtures: the engine actually runs,
 * so warband/deck/turn invariants are preserved.
 *
 * All helpers return `{ game, engine }` so tests can continue driving
 * the same engine instance (matches how production code uses it).
 */

type FirstPlayerId = "player:one" | "player:two";

/**
 * Game is in the first player's action step, round 1, combat has not
 * yet started. Uses the setup-practice warband (mirror matchup, no
 * deck).  This is the cheapest starting point for most action tests.
 */
export function createGameInActionStep(firstPlayerId: FirstPlayerId = "player:one"): {
  game: Game;
  engine: GameEngine;
} {
  const game = createCombatReadySetupPracticeGame();
  const engine = new GameEngine();
  engine.startCombatRound(game, [deterministicFirstPlayerRollOff], firstPlayerId);
  return { game, engine };
}

/**
 * Game is in the first player's power step, round 1. Reached by
 * passing the action step from {@link createGameInActionStep}.  Useful
 * for tests that check power-step-only actions (delve, upgrades, etc).
 */
export function createGameInPowerStep(firstPlayerId: FirstPlayerId = "player:one"): {
  game: Game;
  engine: GameEngine;
} {
  const { game, engine } = createGameInActionStep(firstPlayerId);
  engine.applyGameAction(game, new PassAction(firstPlayerId));
  return { game, engine };
}

/**
 * Both players have fully passed round 1 — the game is now in the end
 * phase at the ScoreObjectives step. From here, tests can drive the
 * end phase via `EndPhaseActionService` + `engine.applyEndPhaseAction`.
 *
 * A round requires each player to complete 4 turns (8 total), alternating
 * (firstPlayer → other → firstPlayer → other → ...).  We drive each
 * turn with an action-pass followed by a power-pass.
 */
export function createGameInEndPhase(firstPlayerId: FirstPlayerId = "player:one"): {
  game: Game;
  engine: GameEngine;
} {
  const { game, engine } = createGameInActionStep(firstPlayerId);
  for (let i = 0; i < 8; i += 1) {
    const activePlayerId = game.activePlayerId;
    if (activePlayerId === null) {
      throw new Error("Expected an active player while draining round 1 turns.");
    }
    // Each turn = pass action step + pass power step.
    engine.applyGameAction(game, new PassAction(activePlayerId));
    engine.applyGameAction(game, new PassAction(activePlayerId));
  }
  return { game, engine };
}
