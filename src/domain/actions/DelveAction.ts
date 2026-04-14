import type { FeatureTokenId, FighterId, PlayerId } from "../values/ids";
import { FeatureTokenSide, GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";

export class DelveAction extends GameAction {
  public readonly fighterId: FighterId;
  public readonly featureTokenId: FeatureTokenId;

  public constructor(playerId: PlayerId, fighterId: FighterId, featureTokenId: FeatureTokenId) {
    super(GameActionKind.Delve, playerId);
    this.fighterId = fighterId;
    this.featureTokenId = featureTokenId;
  }
}

export const DelveActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatPowerStep(player.id)) return [];
    if (player.hasDelvedThisPowerStep) return [];

    return player.fighters.flatMap((fighter) => {
      if (fighter.isSlain || fighter.currentHexId === null) return [];
      const fighterHex = game.getFighterHex(fighter);
      if (fighterHex?.featureTokenId === null || fighterHex?.featureTokenId === undefined) return [];
      const featureToken = game.getFeatureToken(fighterHex.featureTokenId);
      if (featureToken === undefined || featureToken.hexId !== fighterHex.id || featureToken.side === FeatureTokenSide.Hidden) {
        return [];
      }
      return [new DelveAction(player.id, fighter.id, featureToken.id)];
    });
  },
};
