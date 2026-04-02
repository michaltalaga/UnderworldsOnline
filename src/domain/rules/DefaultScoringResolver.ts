import type { PlayerId } from "../values/ids";
import { CardInstance } from "../state/CardInstance";
import { Game } from "../state/Game";
import { ObjectiveConditionTiming } from "../values/enums";
import { ScoringResolver } from "./ScoringResolver";

export class DefaultScoringResolver extends ScoringResolver {
  public getScorableObjectives(
    game: Game,
    playerId: PlayerId,
    timing: ObjectiveConditionTiming,
  ): CardInstance[] {
    const player = game.getPlayer(playerId);
    if (player === undefined) {
      return [];
    }

    return player.objectiveHand.filter((card) => {
      const definition = player.getCardDefinition(card.id);
      if (definition === undefined) {
        return false;
      }

      const objectiveRule = definition.objectiveRule;
      if (objectiveRule === null || objectiveRule.timing !== timing) {
        return false;
      }

      return objectiveRule.canScore(game, player.id);
    });
  }
}
