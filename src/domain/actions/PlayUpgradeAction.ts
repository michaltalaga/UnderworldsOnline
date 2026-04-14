import { CardKind, GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Card } from "../cards/Card";
import { Fighter } from "../state/Fighter";

export class PlayUpgradeAction extends GameAction {
  public readonly card: Card;
  public readonly fighter: Fighter;

  public constructor(player: Player, card: Card, fighter: Fighter) {
    super(GameActionKind.PlayUpgrade, player);
    this.card = card;
    this.fighter = fighter;
  }
}

export const PlayUpgradeActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatPowerStep(player.id)) return [];

    return player.powerHand.flatMap((card) => {
      if (card.kind !== CardKind.Upgrade) return [];
      const targets = card.getLegalTargets(game);
      return targets.flatMap((target) =>
        target instanceof Fighter
          ? [new PlayUpgradeAction(player, card, target)]
          : [],
      );
    });
  },
};
