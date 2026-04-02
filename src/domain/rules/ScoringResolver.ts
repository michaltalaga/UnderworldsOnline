import type { PlayerId } from "../values/ids";
import type { ObjectiveConditionTiming } from "../values/enums";
import { CardInstance } from "../state/CardInstance";
import type { GameEventLogState } from "../state/GameEventLogState";
import { Game } from "../state/Game";

export abstract class ScoringResolver {
  public abstract getScorableObjectives(
    game: Game,
    playerId: PlayerId,
    timing: ObjectiveConditionTiming,
    world?: GameEventLogState,
  ): CardInstance[];
}
