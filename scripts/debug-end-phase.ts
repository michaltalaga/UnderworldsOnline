import { createEndPhaseDebugSnapshot } from "../src/debug/createCombatDebugGame.ts";

const { game } = createEndPhaseDebugSnapshot();

if (
  game.lastObjectiveScoringResolution === null
  || game.lastObjectiveDrawResolution === null
  || game.lastPowerDrawResolution === null
  || game.lastCleanupResolution === null
) {
  throw new Error("End-phase debug snapshot did not produce the expected stored resolutions.");
}

console.log(JSON.stringify({
  state: game.state,
  roundNumber: game.roundNumber,
  lastObjectiveScoringResolution: game.lastObjectiveScoringResolution,
  objectiveScoringHistory: game.objectiveScoringHistory,
  lastObjectiveDrawResolution: game.lastObjectiveDrawResolution,
  objectiveDrawHistory: game.objectiveDrawHistory,
  lastPowerDrawResolution: game.lastPowerDrawResolution,
  powerDrawHistory: game.powerDrawHistory,
  lastCleanupResolution: game.lastCleanupResolution,
  cleanupHistory: game.cleanupHistory,
  recentEvents: game.eventLog.slice(-12),
}, null, 2));
