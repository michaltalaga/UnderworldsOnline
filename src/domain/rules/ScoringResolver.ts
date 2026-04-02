import type { PlayerId } from "../values/ids";
import type { CardPlayContext } from "../definitions/CardDefinition";
import { CardInstance } from "../state/CardInstance";
import type { GameEventLogState } from "../state/GameEventLogState";
import { Game } from "../state/Game";

export abstract class ScoringResolver {
  public abstract getScorableObjectives(
    game: Game,
    playerId: PlayerId,
    context: CardPlayContext,
    world?: GameEventLogState,
  ): CardInstance[];
}
