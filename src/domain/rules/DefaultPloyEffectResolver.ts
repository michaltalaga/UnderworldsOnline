import { CardDefinition } from "../definitions/CardDefinition";
import type { PloyEffect } from "../definitions/PloyEffect";
import { Game } from "../state/Game";
import { PlayerState } from "../state/PlayerState";
import { CardKind, CardZone, PloyEffectKind } from "../values/enums";
import { PloyEffectResolver } from "./PloyEffectResolver";

export class DefaultPloyEffectResolver extends PloyEffectResolver {
  public canResolve(
    _game: Game,
    player: PlayerState,
    ploy: CardDefinition,
  ): boolean {
    return (
      ploy.kind === CardKind.Ploy &&
      ploy.ployEffects.length > 0 &&
      ploy.ployEffects.every((effect) => this.canResolveEffect(player, effect))
    );
  }

  public resolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
  ): string[] {
    if (!this.canResolve(game, player, ploy)) {
      throw new Error(`Ploy ${ploy.name} cannot currently resolve.`);
    }

    return ploy.ployEffects.map((effect) => this.resolveEffect(player, effect));
  }

  private canResolveEffect(player: PlayerState, effect: PloyEffect): boolean {
    switch (effect.kind) {
      case PloyEffectKind.DrawPowerCards:
        return Number.isInteger(effect.count) && effect.count > 0 && player.powerDeck.drawPile.length >= effect.count;
      case PloyEffectKind.GainWarscrollTokens:
        return Object.values(effect.tokens).every((tokenCount) => Number.isInteger(tokenCount) && tokenCount > 0);
    }
  }

  private resolveEffect(player: PlayerState, effect: PloyEffect): string {
    switch (effect.kind) {
      case PloyEffectKind.DrawPowerCards:
        this.drawPowerCards(player, effect.count);
        return `drew ${effect.count} power card${effect.count === 1 ? "" : "s"}`;
      case PloyEffectKind.GainWarscrollTokens: {
        for (const [tokenName, tokenCount] of Object.entries(effect.tokens)) {
          const currentTokenCount = player.warscrollState.tokens[tokenName] ?? 0;
          player.warscrollState.tokens[tokenName] = currentTokenCount + tokenCount;
        }

        return `gained ${this.formatTokenAmounts(effect.tokens)}`;
      }
    }
  }

  private drawPowerCards(player: PlayerState, count: number): void {
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
