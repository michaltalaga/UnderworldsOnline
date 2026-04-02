import { GameRecordKind } from "../../state/GameRecord";
import { ObjectiveConditionTiming } from "../../values/enums";
import type { PlayerId } from "../../values/ids";
import type { Game } from "../../state/Game";
import { ObjectiveRule } from "./ObjectiveRule";

export class PracticeObjective03Rule extends ObjectiveRule {
  public constructor() {
    super("card-def:setup-practice:objective:03", ObjectiveConditionTiming.Immediate);
  }

  public override canScore(game: Game, playerId: PlayerId): boolean {
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

    const player = game.getPlayer(playerId);
    const opponent = game.getOpponent(playerId);
    if (player === undefined || opponent === undefined) {
      return false;
    }

    return player.glory < opponent.glory;
  }
}
