import type { PlayerId } from "../values/ids";
import { CardInstance } from "../state/CardInstance";
import { Game } from "../state/Game";
import {
  FeatureTokenSide,
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
      case ObjectiveConditionKind.DelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStart:
        return this.didPlayerDelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStart(game, playerId);
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

  private didPlayerDelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStart(game: Game, playerId: PlayerId): boolean {
    const thisRoundPlayerDelves = game.getRecordHistory(GameRecordKind.Delve).filter((delve) =>
      delve.roundNumber === game.roundNumber && delve.playerId === playerId,
    );
    const thisRoundTreasureDelves = thisRoundPlayerDelves.filter((delve) =>
      delve.sideBeforeDelve === FeatureTokenSide.Treasure,
    );

    const delvedTreasureTokenIds = new Set(
      thisRoundTreasureDelves.map((delve) => delve.featureTokenId),
    );
    const delvedTokenIds = new Set(
      thisRoundPlayerDelves.map((delve) => delve.featureTokenId),
    );

    if (delvedTreasureTokenIds.size >= 3) {
      return true;
    }

    const roundStartHistory = game.getRecordHistory(GameRecordKind.RoundStart);
    let roundStart = null;
    for (let index = roundStartHistory.length - 1; index >= 0; index -= 1) {
      const record = roundStartHistory[index];
      if (record?.roundNumber === game.roundNumber) {
        roundStart = record;
        break;
      }
    }

    if (roundStart === null) {
      return false;
    }

    return roundStart.featureTokens.some((featureToken) =>
      featureToken.side === FeatureTokenSide.Treasure &&
      featureToken.heldByFighterId !== null &&
      featureToken.holderOwnerPlayerId !== null &&
      featureToken.holderOwnerPlayerId !== playerId &&
      delvedTokenIds.has(featureToken.featureTokenId),
    );
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
