import { Card, type Target } from "./Card";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { CardKind, CardZone } from "../values/enums";

/**
 * Base class for all ploy cards.
 *
 * Handles the common preconditions (must be in power hand, must be in power step).
 * Subclasses override:
 *  - `getTargets(game)` to specify who can be targeted (default: untargeted → [this.owner])
 *  - `onPlay(game, target)` to apply the card's effect (default: no-op)
 */
export class PloyCard extends Card {
  constructor(
    id: string,
    owner: Player,
    name: string,
    text: string,
    zone: CardZone,
  ) {
    super(id, owner, CardKind.Ploy, name, text, 0, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.PowerHand) return [];
    if (game.turnStep !== "power") return [];
    return this.getTargets(game);
  }

  /** Who can this ploy target? Default: untargeted (player is the target). */
  protected getTargets(_game: Game): Target[] {
    return [this.owner];
  }

  override applyEffect(game: Game, target: Target | null): string[] {
    return this.onPlay(game, target);
  }

  /** What happens when this ploy is played? Default: nothing. */
  protected onPlay(_game: Game, _target: Target | null): string[] {
    return [];
  }
}
