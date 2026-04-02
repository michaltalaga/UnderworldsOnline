import type { PlayerId } from "../values/ids";
import { CardInstance } from "../state/CardInstance";
import type { GameEventLogState } from "../state/GameEventLogState";
import { Game } from "../state/Game";
import type { CardPlayContext } from "../definitions/CardDefinition";
import { ScoringResolver } from "./ScoringResolver";

export class DefaultScoringResolver extends ScoringResolver {
  public getScorableObjectives(
    game: Game,
    playerId: PlayerId,
    context: CardPlayContext,
    world: GameEventLogState = game.getEventLogState(),
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

      return definition.canPlay(game, world, player, card, context);
    });
  }
}
