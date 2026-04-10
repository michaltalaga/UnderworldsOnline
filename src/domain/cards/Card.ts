import type { FighterState } from "../state/FighterState";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import type { CardKind, CardZone } from "../values/enums";

// A target is any game object the card can be played on.
// PlayerState = untargeted plays (e.g. "gain 1 glory" targets the player).
// FighterState = targeted plays (e.g. "give Guard token" targets a fighter).
export type Target = PlayerState | FighterState;

// Single base class for all cards in the game. Merges the old
// CardInstance (mutable state: zone, revealed, attached fighter) with
// CardDefinition (identity: name, text, kind, gloryValue) and behavior
// (getLegalTargets, play).
//
// Each card knows its owner and can self-report what it can legally
// target via getLegalTargets(). An empty array means the card cannot
// be played right now.
export class Card {
  readonly id: string; // for debugging/logging only — never use for lookups
  readonly owner: PlayerState;
  readonly kind: CardKind;
  readonly name: string;
  readonly text: string;
  readonly gloryValue: number;

  zone: CardZone;
  attachedToFighter: FighterState | null;
  revealed: boolean;

  constructor(
    id: string,
    owner: PlayerState,
    kind: CardKind,
    name: string,
    text: string,
    gloryValue: number,
    zone: CardZone,
    attachedToFighter: FighterState | null = null,
    revealed: boolean = false,
  ) {
    this.id = id;
    this.owner = owner;
    this.kind = kind;
    this.name = name;
    this.text = text;
    this.gloryValue = gloryValue;
    this.zone = zone;
    this.attachedToFighter = attachedToFighter;
    this.revealed = revealed;
  }

  // Returns the objects this card can legally target right now.
  // Empty array = not playable. The UI uses the returned object
  // references directly for highlighting.
  getLegalTargets(_game: Game): Target[] {
    return [];
  }

  // Apply the card's specific effect when played against a target.
  // The engine calls this after validation and event recording.
  // Returns effect descriptions for the resolution log.
  // Base implementation is a no-op — subclasses override for real effects.
  applyEffect(_game: Game, _target: Target | null): string[] {
    return [];
  }
}

// Factory function type for deck/warband definitions. The definition
// knows what KIND of card to create; the factory is called at game
// setup time when the owner (PlayerState) is known.
export type CardFactory = (id: string, owner: PlayerState, zone: CardZone) => Card;

// Constructor type for concrete card classes whose constructor is (id, owner, zone).
export type CardConstructor = new (id: string, owner: PlayerState, zone: CardZone) => Card;

/** Wrap a concrete card class in a CardFactory. */
export function asFactory(Ctor: CardConstructor): CardFactory {
  return (id, owner, zone) => new Ctor(id, owner, zone);
}
