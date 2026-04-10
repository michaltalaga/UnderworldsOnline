import type { Player } from "../state/Player";
import type { CardZone } from "../values/enums";
import type { CardFactory } from "./Card";
import { ObjectiveCard } from "./ObjectiveCard";
import { PloyCard } from "./PloyCard";
import { UpgradeCard } from "./UpgradeCard";

const PLACEHOLDER_TEXT = "(Placeholder — card effect not yet implemented.)";

/** An objective with no scoring condition — never playable. */
export class PlaceholderObjective extends ObjectiveCard {
  constructor(id: string, owner: Player, name: string, zone: CardZone) {
    super(id, owner, name, PLACEHOLDER_TEXT, 1, zone);
  }

  protected override canScore(): boolean {
    return false;
  }
}

/** A ploy with no targets — never playable. */
export class PlaceholderPloy extends PloyCard {
  constructor(id: string, owner: Player, name: string, zone: CardZone) {
    super(id, owner, name, PLACEHOLDER_TEXT, zone);
  }

  protected override getTargets(): never[] {
    return [];
  }
}

/** An upgrade with no targets — never playable. */
export class PlaceholderUpgrade extends UpgradeCard {
  constructor(id: string, owner: Player, name: string, zone: CardZone) {
    super(id, owner, name, PLACEHOLDER_TEXT, 1, zone);
  }

  protected override getTargets(): never[] {
    return [];
  }
}

/** Factory for placeholder objectives. */
export function placeholderObjectiveFactory(name: string): CardFactory {
  return (id, owner, zone) => new PlaceholderObjective(id, owner, name, zone);
}

/** Factory for placeholder ploys. */
export function placeholderPloyFactory(name: string): CardFactory {
  return (id, owner, zone) => new PlaceholderPloy(id, owner, name, zone);
}

/** Factory for placeholder upgrades. */
export function placeholderUpgradeFactory(name: string): CardFactory {
  return (id, owner, zone) => new PlaceholderUpgrade(id, owner, name, zone);
}
