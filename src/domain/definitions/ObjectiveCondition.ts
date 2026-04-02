import {
  ObjectiveConditionKind,
  ObjectiveConditionTiming,
} from "../values/enums";

export type AttackRollAllSuccessesObjectiveCondition = {
  kind: typeof ObjectiveConditionKind.AttackRollAllSuccesses;
  timing: typeof ObjectiveConditionTiming.Immediate;
};

export type SlayLeaderOrEqualOrGreaterHealthObjectiveCondition = {
  kind: typeof ObjectiveConditionKind.SlayLeaderOrEqualOrGreaterHealth;
  timing: typeof ObjectiveConditionTiming.Immediate;
};

export type DelveInEnemyTerritoryOrFriendlyIfUnderdogObjectiveCondition = {
  kind: typeof ObjectiveConditionKind.DelveInEnemyTerritoryOrFriendlyIfUnderdog;
  timing: typeof ObjectiveConditionTiming.Immediate;
};

export type DelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStartObjectiveCondition = {
  kind: typeof ObjectiveConditionKind.DelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStart;
  timing: typeof ObjectiveConditionTiming.EndPhase;
};

export type ObjectiveCondition =
  | AttackRollAllSuccessesObjectiveCondition
  | SlayLeaderOrEqualOrGreaterHealthObjectiveCondition
  | DelveInEnemyTerritoryOrFriendlyIfUnderdogObjectiveCondition
  | DelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStartObjectiveCondition;
