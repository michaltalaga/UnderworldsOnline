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
      case ObjectiveConditionKind.SlayLeaderOrEqualOrGreaterHealth:
        return this.didPlayerSlayLeaderOrEqualOrGreaterHealthEnemy(game, playerId);
      case ObjectiveConditionKind.DelveInEnemyTerritoryOrFriendlyIfUnderdog:
        return this.didPlayerDelveInEnemyTerritoryOrFriendlyIfUnderdog(game, playerId);
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

  private didPlayerSlayLeaderOrEqualOrGreaterHealthEnemy(game: Game, playerId: PlayerId): boolean {
    const latestCombat = game.getLatestRecord(GameRecordKind.Combat);
    if (
      latestCombat === null ||
      latestCombat.context.attackerPlayerId !== playerId ||
      !latestCombat.targetSlain
    ) {
      return false;
    }

    const attackerPlayer = game.getPlayer(latestCombat.context.attackerPlayerId);
    const defenderPlayer = game.getPlayer(latestCombat.context.defenderPlayerId);
    const attackerDefinition = attackerPlayer?.getFighterDefinition(latestCombat.context.attackerFighterId);
    const targetDefinition = defenderPlayer?.getFighterDefinition(latestCombat.context.targetFighterId);
    if (
      attackerDefinition === undefined ||
      targetDefinition === undefined
    ) {
      return false;
    }

    return targetDefinition.isLeader || targetDefinition.health >= attackerDefinition.health;
  }

  private didPlayerDelveInEnemyTerritoryOrFriendlyIfUnderdog(game: Game, playerId: PlayerId): boolean {
    const latestDelve = game.getLatestRecord(GameRecordKind.Delve);
    if (latestDelve === null || latestDelve.playerId !== playerId) {
      return false;
    }

    const delveHex = game.board.getHex(latestDelve.featureTokenHexId);
    if (delveHex?.territoryId === null || delveHex?.territoryId === undefined) {
      return false;
    }

    const territory = game.board.getTerritory(delveHex.territoryId);
    if (territory?.ownerPlayerId === null || territory?.ownerPlayerId === undefined) {
      return false;
    }

    if (territory.ownerPlayerId !== playerId) {
      return true;
    }

    return this.isUnderdog(game, playerId);
  }

  private isUnderdog(game: Game, playerId: PlayerId): boolean {
    const player = game.getPlayer(playerId);
    const opponent = game.getOpponent(playerId);
    if (player === undefined || opponent === undefined) {
      return false;
    }

    return player.glory < opponent.glory;
  }
}
