import { GameRecordKind } from "../src/domain/index.ts";
import { createEndPhaseDebugSnapshot, type EndPhaseDebugMode } from "../src/debug/createCombatDebugGame.ts";

const modeArg = process.argv[2];
const mode: EndPhaseDebugMode = modeArg === "final" ? "final" : "round";
const { game } = createEndPhaseDebugSnapshot(mode);
const lastObjectiveScoringResolution = game.getLatestRecord(GameRecordKind.ObjectiveScoring);
const objectiveScoringHistory = game.getRecordHistory(GameRecordKind.ObjectiveScoring);
const lastObjectiveDrawResolution = game.getLatestRecord(GameRecordKind.ObjectiveDraw);
const objectiveDrawHistory = game.getRecordHistory(GameRecordKind.ObjectiveDraw);
const lastPowerDrawResolution = game.getLatestRecord(GameRecordKind.PowerDraw);
const powerDrawHistory = game.getRecordHistory(GameRecordKind.PowerDraw);
const lastCleanupResolution = game.getLatestRecord(GameRecordKind.Cleanup);
const cleanupHistory = game.getRecordHistory(GameRecordKind.Cleanup);

if (
  lastObjectiveScoringResolution === null
  || lastObjectiveDrawResolution === null
  || lastPowerDrawResolution === null
  || lastCleanupResolution === null
) {
  throw new Error("End-phase debug snapshot did not produce the expected stored resolutions.");
}

console.log(JSON.stringify({
  mode,
  state: game.state,
  roundNumber: game.roundNumber,
  winnerPlayerId: game.winnerPlayerId,
  lastObjectiveScoringResolution,
  objectiveScoringHistory,
  lastObjectiveDrawResolution,
  objectiveDrawHistory,
  lastPowerDrawResolution,
  powerDrawHistory,
  lastCleanupResolution,
  cleanupHistory,
  recentEvents: game.eventLog.slice(-12),
}, null, 2));
