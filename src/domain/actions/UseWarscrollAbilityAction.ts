import type { PlayerId } from "../values/ids";
import { GameActionKind, TurnStep } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { DefaultWarscrollEffectResolver } from "../rules/DefaultWarscrollEffectResolver";

export class UseWarscrollAbilityAction extends GameAction {
  public readonly abilityIndex: number;

  public constructor(playerId: PlayerId, abilityIndex: number) {
    super(GameActionKind.UseWarscrollAbility, playerId);
    this.abilityIndex = abilityIndex;
  }
}

const warscrollEffectResolver = new DefaultWarscrollEffectResolver();

export const UseWarscrollAbilityActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatPowerStep(player.id)) return [];
    const warscrollDefinition = player.getWarscrollDefinition();
    if (warscrollDefinition === undefined) return [];

    return warscrollDefinition.abilities.flatMap((ability, abilityIndex) => {
      if (ability.timing !== TurnStep.Power) return [];
      const hasTokens = Object.entries(ability.tokenCosts).every(
        ([tokenName, tokenCost]) => player.getWarscrollTokenCount(tokenName) >= tokenCost,
      );
      if (!hasTokens) return [];
      if (!warscrollEffectResolver.canResolve(game, player, ability)) return [];
      return [new UseWarscrollAbilityAction(player.id, abilityIndex)];
    });
  },
};
