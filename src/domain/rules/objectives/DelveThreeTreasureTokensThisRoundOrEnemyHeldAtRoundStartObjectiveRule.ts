import { GameRecordKind } from "../../state/GameRecord";
import { FeatureTokenSide, ObjectiveConditionTiming } from "../../values/enums";
import type { PlayerId } from "../../values/ids";
import type { Game } from "../../state/Game";
import { ObjectiveRule } from "./ObjectiveRule";

export class PracticeObjective04Rule extends ObjectiveRule {
  public constructor() {
    super("card-def:setup-practice:objective:04", ObjectiveConditionTiming.EndPhase);
  }

  public override canScore(game: Game, playerId: PlayerId): boolean {
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
    for (let index = roundStartHistory.length - 1; index >= 0; index -= 1) {
      const roundStart = roundStartHistory[index];
      if (roundStart.roundNumber !== game.roundNumber) {
        continue;
      }

      return roundStart.featureTokens.some((featureToken) =>
        featureToken.side === FeatureTokenSide.Treasure &&
        featureToken.heldByFighterId !== null &&
        featureToken.holderOwnerPlayerId !== null &&
        featureToken.holderOwnerPlayerId !== playerId &&
        delvedTokenIds.has(featureToken.featureTokenId),
      );
    }

    return false;
  }
}
