import { createEndPhaseDebugSnapshot, type EndPhaseDebugMode } from "../src/debug/createCombatDebugGame.ts";

const modeArg = process.argv[2];
const mode: EndPhaseDebugMode = modeArg === "final" ? "final" : "round";
const { game } = createEndPhaseDebugSnapshot(mode);

if (
  game.lastObjectiveScoringResolution === null
  || game.lastObjectiveDrawResolution === null
  || game.lastPowerDrawResolution === null
  || game.lastCleanupResolution === null
) {
  throw new Error("End-phase debug snapshot did not produce the expected stored resolutions.");
}

console.log(JSON.stringify({
  mode,
  state: game.state,
  roundNumber: game.roundNumber,
  winnerPlayerId: game.winnerPlayerId,
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
