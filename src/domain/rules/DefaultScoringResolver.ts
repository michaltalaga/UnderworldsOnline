import type { PlayerId } from "../values/ids";
import { CardInstance } from "../state/CardInstance";
import { Game } from "../state/Game";
import {
  ObjectiveConditionKind,
  ObjectiveConditionTiming,
} from "../values/enums";
import { GameRecordKind } from "../state/GameRecord";
import type { ObjectiveCondition } from "../definitions/ObjectiveCondition";
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

      return definition.objectiveConditions.some((condition) =>
        this.isConditionMet(game, player.id, timing, condition),
      );
    });
  }

  private isConditionMet(
    game: Game,
    playerId: PlayerId,
    timing: ObjectiveConditionTiming,
    condition: ObjectiveCondition,
  ): boolean {
    if (condition.timing !== timing) {
      return false;
    }

    switch (condition.kind) {
      case ObjectiveConditionKind.AttackRollAllSuccesses:
        return this.didPlayerMakeAnAllSuccessesAttackRoll(game, playerId);
      default:
        return false;
    }
  }

  private didPlayerMakeAnAllSuccessesAttackRoll(game: Game, playerId: PlayerId): boolean {
    const latestCombat = game.getLatestRecord(GameRecordKind.Combat);
    if (latestCombat === null || latestCombat.context.attackerPlayerId !== playerId) {
      return false;
    }

    return latestCombat.attackRoll.length > 0 && latestCombat.attackSuccesses === latestCombat.attackRoll.length;
  }
}
