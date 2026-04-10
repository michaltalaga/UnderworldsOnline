import { WarscrollAbilityDefinition } from "../definitions/WarscrollAbilityDefinition";
import type { WarscrollAbilityEffect } from "../definitions/WarscrollAbilityEffect";
import { Game } from "../state/Game";
import { Player } from "../state/Player";
import { CardZone, WarscrollAbilityEffectKind } from "../values/enums";
import { WarscrollEffectResolver } from "./WarscrollEffectResolver";

export class DefaultWarscrollEffectResolver extends WarscrollEffectResolver {
  public canResolve(
    _game: Game,
    player: Player,
    ability: WarscrollAbilityDefinition,
  ): boolean {
    return ability.effects.length > 0 && ability.effects.every((effect) => this.canResolveEffect(player, effect));
  }

  public resolve(
    game: Game,
    player: Player,
    ability: WarscrollAbilityDefinition,
  ): string[] {
    if (!this.canResolve(game, player, ability)) {
      throw new Error(`Warscroll ability ${ability.name} cannot currently resolve.`);
    }

    return ability.effects.map((effect) => this.resolveEffect(player, effect));
  }

  private canResolveEffect(player: Player, effect: WarscrollAbilityEffect): boolean {
    switch (effect.kind) {
      case WarscrollAbilityEffectKind.DrawPowerCards:
        return Number.isInteger(effect.count) && effect.count > 0 && player.powerDeck.drawPile.length >= effect.count;
      case WarscrollAbilityEffectKind.GainWarscrollTokens:
        return Object.values(effect.tokens).every((tokenCount) => Number.isInteger(tokenCount) && tokenCount > 0);
    }
  }

  private resolveEffect(player: Player, effect: WarscrollAbilityEffect): string {
    switch (effect.kind) {
      case WarscrollAbilityEffectKind.DrawPowerCards:
        this.drawPowerCards(player, effect.count);
        return `drew ${effect.count} power card${effect.count === 1 ? "" : "s"}`;
      case WarscrollAbilityEffectKind.GainWarscrollTokens: {
        for (const [tokenName, tokenCount] of Object.entries(effect.tokens)) {
          const currentTokenCount = player.warscrollState.tokens[tokenName] ?? 0;
          player.warscrollState.tokens[tokenName] = currentTokenCount + tokenCount;
        }

        return `gained ${this.formatTokenAmounts(effect.tokens)}`;
      }
    }
  }

  private drawPowerCards(player: Player, count: number): void {
    for (let drawIndex = 0; drawIndex < count; drawIndex += 1) {
      const nextCard = player.powerDeck.drawPile.shift();
      if (nextCard === undefined) {
        throw new Error(`Could not draw power card ${drawIndex + 1} for ${player.name}.`);
      }

      nextCard.zone = CardZone.PowerHand;
      player.powerHand.push(nextCard);
    }
  }

  private formatTokenAmounts(tokens: Readonly<Record<string, number>>): string {
    return Object.entries(tokens)
      .map(([tokenName, tokenCount]) => `${tokenCount} ${tokenName} token${tokenCount === 1 ? "" : "s"}`)
      .join(", ");
  }
}
