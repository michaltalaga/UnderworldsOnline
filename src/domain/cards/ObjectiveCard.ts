import { Card, type Target } from "./Card";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { CardKind, CardZone } from "../values/enums";

/**
 * Base class for all objective cards.
 *
 * Handles the common precondition (must be in objective hand).
 * Subclasses override `canScore(game)` to define when this objective is scorable.
 * Default: scorable during the end phase.
 */
export class ObjectiveCard extends Card {
  constructor(
    id: string,
    owner: Player,
    name: string,
    text: string,
    gloryValue: number,
    zone: CardZone,
  ) {
    super(id, owner, CardKind.Objective, name, text, gloryValue, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.ObjectiveHand) return [];
    if (!this.canScore(game)) return [];
    return [this.owner];
  }

  /** Can this objective be scored right now? Default: only during end phase. */
  protected canScore(game: Game): boolean {
    return game.phase === "end";
  }
}
