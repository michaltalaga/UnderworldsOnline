import type { FighterId } from "../values/ids";
import type {
  EndPhaseActionKind,
  GameActionKind,
  ObjectiveConditionTiming,
} from "../values/enums";

export type CardTriggerKind = GameActionKind | EndPhaseActionKind;

export type CardPlayContext = {
  timing?: ObjectiveConditionTiming;
  targetFighterId?: FighterId | null;
  equippedFighterId?: FighterId | null;
  triggerActionKind?: CardTriggerKind | null;
};
