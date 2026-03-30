import type { BoardSide } from "../values/enums";
import type { PlayerId, TerritoryId } from "../values/ids";
import { SetupActionKind } from "../values/enums";
import { SetupAction } from "./SetupAction";

export class ChooseTerritoryAction extends SetupAction {
  public readonly boardSide: BoardSide;
  public readonly territoryId: TerritoryId;

  public constructor(playerId: PlayerId, boardSide: BoardSide, territoryId: TerritoryId) {
    super(SetupActionKind.ChooseTerritory, playerId);
    this.boardSide = boardSide;
    this.territoryId = territoryId;
  }
}
