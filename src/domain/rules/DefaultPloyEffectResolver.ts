import { CardDefinition } from "../definitions/CardDefinition";
import type { PloyEffect } from "../definitions/PloyEffect";
import { FighterState } from "../state/FighterState";
import { Game } from "../state/Game";
import { PlayerState } from "../state/PlayerState";
import {
  CardKind,
  CardZone,
  FighterTokenKind,
  PloyEffectKind,
  PloyEffectTargetKind,
} from "../values/enums";
import type { FighterId } from "../values/ids";
import { PloyEffectResolver } from "./PloyEffectResolver";

export class DefaultPloyEffectResolver extends PloyEffectResolver {
  public canResolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
    targetFighterId: FighterId | null = null,
  ): boolean {
    const requiresTarget = ploy.ployEffects.some((effect) => this.effectRequiresTarget(effect));

    return (
      ploy.kind === CardKind.Ploy &&
      ploy.ployEffects.length > 0 &&
      (requiresTarget ? targetFighterId !== null : targetFighterId === null) &&
      ploy.ployEffects.every((effect) => this.canResolveEffect(game, player, effect, targetFighterId))
    );
  }

  public resolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
    targetFighterId: FighterId | null = null,
  ): string[] {
    if (!this.canResolve(game, player, ploy, targetFighterId)) {
      throw new Error(`Ploy ${ploy.name} cannot currently resolve.`);
    }

    return ploy.ployEffects.map((effect) => this.resolveEffect(game, player, effect, targetFighterId));
  }

  private canResolveEffect(
    game: Game,
    player: PlayerState,
    effect: PloyEffect,
    targetFighterId: FighterId | null,
  ): boolean {
    switch (effect.kind) {
      case PloyEffectKind.DrawPowerCards:
        return Number.isInteger(effect.count) && effect.count > 0 && player.powerDeck.drawPile.length >= effect.count;
      case PloyEffectKind.GainWarscrollTokens:
        return Object.values(effect.tokens).every((tokenCount) => Number.isInteger(tokenCount) && tokenCount > 0);
      case PloyEffectKind.GainFighterToken: {
        const target = this.getTargetFighter(game, player, effect, targetFighterId);
        return target !== undefined && !this.hasFighterToken(target, effect.token);
      }
    }
  }

  private effectRequiresTarget(effect: PloyEffect): boolean {
    return effect.kind === PloyEffectKind.GainFighterToken;
  }

  private resolveEffect(
    game: Game,
    player: PlayerState,
    effect: PloyEffect,
    targetFighterId: FighterId | null,
  ): string {
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
      case PloyEffectKind.GainFighterToken: {
        const target = this.getTargetFighter(game, player, effect, targetFighterId);
        if (target === undefined) {
          throw new Error(`Could not find a legal fighter target for ${effect.kind}.`);
        }

        this.setFighterToken(target, effect.token, true);
        return `gave ${effect.token} token to fighter ${target.id}`;
      }
    }
  }

  private getTargetFighter(
    game: Game,
    player: PlayerState,
    effect: Extract<
      PloyEffect,
      { kind: typeof PloyEffectKind.GainFighterToken }
    >,
    targetFighterId: FighterId | null,
  ): FighterState | undefined {
    if (targetFighterId === null) {
      return undefined;
    }

    const targetOwner =
      effect.target === PloyEffectTargetKind.FriendlyFighter
        ? player
        : effect.target === PloyEffectTargetKind.EnemyFighter
          ? game.getOpponent(player.id)
          : undefined;
    if (targetOwner === undefined) {
      return undefined;
    }

    const target = targetOwner.getFighter(targetFighterId);
    if (
      target === undefined ||
      target.isSlain ||
      target.currentHexId === null
    ) {
      return undefined;
    }

    return target;
  }

  private hasFighterToken(fighter: FighterState, token: FighterTokenKind): boolean {
    switch (token) {
      case FighterTokenKind.Move:
        return fighter.hasMoveToken;
      case FighterTokenKind.Charge:
        return fighter.hasChargeToken;
      case FighterTokenKind.Guard:
        return fighter.hasGuardToken;
      case FighterTokenKind.Stagger:
        return fighter.hasStaggerToken;
    }
  }

  private setFighterToken(fighter: FighterState, token: FighterTokenKind, value: boolean): void {
    switch (token) {
      case FighterTokenKind.Move:
        fighter.hasMoveToken = value;
        return;
      case FighterTokenKind.Charge:
        fighter.hasChargeToken = value;
        return;
      case FighterTokenKind.Guard:
        fighter.hasGuardToken = value;
        return;
      case FighterTokenKind.Stagger:
        fighter.hasStaggerToken = value;
        return;
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
