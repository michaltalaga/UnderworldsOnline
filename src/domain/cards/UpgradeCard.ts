import { Card, type Target } from "./Card";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import { CardKind, CardZone } from "../values/enums";

/**
 * Base class for all upgrade cards.
 *
 * Handles common preconditions (must be in power hand, must be in power step,
 * owner must have enough glory to pay the cost).
 * Subclasses override `getTargets(game)` to restrict which fighters can receive this upgrade.
 * Default: any alive on-board friendly fighter.
 */
export class UpgradeCard extends Card {
  constructor(
    id: string,
    owner: PlayerState,
    name: string,
    text: string,
    gloryValue: number,
    zone: CardZone,
  ) {
    super(id, owner, CardKind.Upgrade, name, text, gloryValue, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.PowerHand) return [];
    if (game.turnStep !== "power") return [];
    if (this.owner.glory < this.gloryValue) return [];
    return this.getTargets(game);
  }

  /** Which fighters can receive this upgrade? Default: alive on-board friendly fighters. */
  protected getTargets(_game: Game): Target[] {
    return this.owner.fighters.filter(
      (f) => !f.isSlain && f.currentHexId !== null,
    );
  }
}
