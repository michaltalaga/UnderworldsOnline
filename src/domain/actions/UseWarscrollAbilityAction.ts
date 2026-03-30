import type { PlayerId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class UseWarscrollAbilityAction extends GameAction {
  public readonly abilityIndex: number;

  public constructor(playerId: PlayerId, abilityIndex: number) {
    super(GameActionKind.UseWarscrollAbility, playerId);
    this.abilityIndex = abilityIndex;
  }
}
