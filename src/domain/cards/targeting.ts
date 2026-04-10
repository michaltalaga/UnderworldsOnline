import type { Card } from "./Card";
import type { Game } from "../state/Game";
import type { FighterState } from "../state/FighterState";

/** All alive, on-board fighters owned by the card's owner. */
export function friendlyFightersOnBoard(card: Card): FighterState[] {
  return card.owner.fighters.filter(
    (f) => !f.isSlain && f.currentHexId !== null,
  );
}

/** Friendly on-board fighters that don't already have a Guard token. */
export function friendlyFightersWithoutGuard(card: Card): FighterState[] {
  return friendlyFightersOnBoard(card).filter((f) => !f.hasGuardToken);
}

/** All alive, on-board fighters owned by the opponent. */
export function enemyFightersOnBoard(card: Card, game: Game): FighterState[] {
  const opponent = game.getOpponent(card.owner.id);
  if (opponent === undefined) return [];
  return opponent.fighters.filter(
    (f) => !f.isSlain && f.currentHexId !== null,
  );
}

/** Enemy on-board fighters that don't already have a Stagger token. */
export function enemyFightersWithoutStagger(
  card: Card,
  game: Game,
): FighterState[] {
  return enemyFightersOnBoard(card, game).filter((f) => !f.hasStaggerToken);
}
