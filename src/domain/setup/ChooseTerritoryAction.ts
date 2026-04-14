import type { BoardSide } from "../values/enums";
import { SetupActionKind } from "../values/enums";
import type { Player } from "../state/Player";
import type { Territory } from "../state/Territory";
import { SetupAction } from "./SetupAction";

export class ChooseTerritoryAction extends SetupAction {
  public override readonly player: Player;
  public readonly boardSide: BoardSide;
  public readonly territory: Territory;

  public constructor(player: Player, boardSide: BoardSide, territory: Territory) {
    super(SetupActionKind.ChooseTerritory, player);
    this.player = player;
    this.boardSide = boardSide;
    this.territory = territory;
  }
}
