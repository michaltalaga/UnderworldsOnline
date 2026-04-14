import type { CardId, FighterId, PlayerId } from "../values/ids";
import { CardKind, GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { Fighter } from "../state/Fighter";

export class PlayUpgradeAction extends GameAction {
  public readonly cardId: CardId;
  public readonly fighterId: FighterId;

  public constructor(playerId: PlayerId, cardId: CardId, fighterId: FighterId) {
    super(GameActionKind.PlayUpgrade, playerId);
    this.cardId = cardId;
    this.fighterId = fighterId;
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
          ? [new PlayUpgradeAction(player.id, card.id, target.id)]
          : [],
      );
    });
  },
};
