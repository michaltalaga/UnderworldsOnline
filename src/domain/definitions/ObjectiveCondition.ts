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

export type ObjectiveCondition =
  | AttackRollAllSuccessesObjectiveCondition
  | SlayLeaderOrEqualOrGreaterHealthObjectiveCondition;
