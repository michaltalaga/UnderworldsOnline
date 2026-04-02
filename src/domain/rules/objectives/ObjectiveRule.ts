import { CardZone } from "../../values/enums";
import type { CardDefinitionId, PlayerId } from "../../values/ids";
import type { CardDefinition } from "../../definitions/CardDefinition";
import type { ObjectiveScoringCardResolution } from "../../endPhase/ObjectiveScoringResolution";
import type { CardInstance } from "../../state/CardInstance";
import type { Game } from "../../state/Game";
import type { PlayerState } from "../../state/PlayerState";
import type { ObjectiveConditionTiming } from "../../values/enums";

export abstract class ObjectiveRule {
  public readonly cardDefinitionId: CardDefinitionId;
  public readonly timing: ObjectiveConditionTiming;

  protected constructor(
    cardDefinitionId: CardDefinitionId,
    timing: ObjectiveConditionTiming,
  ) {
    this.cardDefinitionId = cardDefinitionId;
    this.timing = timing;
  }

  public abstract canScore(game: Game, playerId: PlayerId): boolean;

  public score(
    game: Game,
    player: PlayerState,
    objectiveCard: CardInstance,
    definition: CardDefinition,
  ): ObjectiveScoringCardResolution {
    void game;

    const handIndex = player.objectiveHand.findIndex((card) => card.id === objectiveCard.id);
    if (handIndex === -1) {
      throw new Error(`Could not find objective ${objectiveCard.id} in ${player.name}'s hand.`);
    }

    player.objectiveHand.splice(handIndex, 1);
    objectiveCard.zone = CardZone.ScoredObjectives;
    objectiveCard.revealed = true;
    player.scoredObjectives.push(objectiveCard);
    player.glory += definition.gloryValue;

    return {
      cardId: objectiveCard.id,
      cardDefinitionId: objectiveCard.definitionId,
      cardName: definition.name,
      gloryValue: definition.gloryValue,
    };
  }
}
