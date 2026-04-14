import { FeatureTokenSide, GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import type { FeatureToken } from "../state/FeatureToken";

export class DelveAction extends GameAction {
  public readonly fighter: Fighter;
  public readonly featureToken: FeatureToken;

  public constructor(player: Player, fighter: Fighter, featureToken: FeatureToken) {
    super(GameActionKind.Delve, player);
    this.fighter = fighter;
    this.featureToken = featureToken;
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
      return [new DelveAction(player, fighter, featureToken)];
    });
  },
};
