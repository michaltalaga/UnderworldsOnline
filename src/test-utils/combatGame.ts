import {
  createCombatReadySetupPracticeGame,
  deterministicFirstPlayerRollOff,
  GameEngine,
  type Game,
} from "../domain";

/**
 * Creates a game that is in the first player's action step, round 1.
 * Uses the setup-practice warband (mirror matchup, no deck).
 */
export function createGameInActionStep(firstPlayerId: "player:one" | "player:two" = "player:one"): {
  game: Game;
  engine: GameEngine;
} {
  const game = createCombatReadySetupPracticeGame();
  const engine = new GameEngine();
  engine.startCombatRound(game, [deterministicFirstPlayerRollOff], firstPlayerId);
  return { game, engine };
}
