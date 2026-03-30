import type { AttackTrait, CardZone, FighterId, Hex, ObjectiveCardType, PowerCardType, SaveTrait, TeamId } from "./types";

export type FighterStatus = "guard" | "charged";

export class Weapon {
  move: number;
  attackDice: number;
  attackTrait: AttackTrait;
  attackRange: number;
  attackDamage: number;
  saveDice: number;
  saveTrait: SaveTrait;
  nextAttackBonusDamage: number;

  constructor(
    move: number,
    attackDice: number,
    attackTrait: AttackTrait,
    attackRange: number,
    attackDamage: number,
    saveDice: number,
    saveTrait: SaveTrait,
    nextAttackBonusDamage = 0,
  ) {
    this.move = move;
    this.attackDice = attackDice;
    this.attackTrait = attackTrait;
    this.attackRange = attackRange;
    this.attackDamage = attackDamage;
    this.saveDice = saveDice;
    this.saveTrait = saveTrait;
    this.nextAttackBonusDamage = nextAttackBonusDamage;
  }
}

export class Fighter {
  id: FighterId;
  team: TeamId;
  name: string;
  position: Hex;
  hp: number;
  maxHp: number;
  weapon: Weapon;
  statuses: FighterStatus[];

  constructor(
    id: FighterId,
    team: TeamId,
    name: string,
    position: Hex,
    hp: number,
    maxHp: number,
    weapon: Weapon,
    statuses: FighterStatus[] = [],
  ) {
    this.id = id;
    this.team = team;
    this.name = name;
    this.position = { ...position };
    this.hp = hp;
    this.maxHp = maxHp;
    this.weapon = weapon;
    this.statuses = [...statuses];
  }
}

export abstract class Card {
  owner: TeamId;
  name: string;
  zone: CardZone;

  constructor(owner: TeamId, name: string, zone: CardZone) {
    this.owner = owner;
    this.name = name;
    this.zone = zone;
  }
}

export class ObjectiveCardModel extends Card {
  goal: ObjectiveCardType;
  glory: number;

  constructor(owner: TeamId, name: string, zone: CardZone, goal: ObjectiveCardType, glory: number) {
    super(owner, name, zone);
    this.goal = goal;
    this.glory = glory;
  }
}

export class PowerCardModel extends Card {
  effect: PowerCardType;

  constructor(owner: TeamId, name: string, zone: CardZone, effect: PowerCardType) {
    super(owner, name, zone);
    this.effect = effect;
  }
}

export class CardPool {
  zone: CardZone;
  cards: Card[];

  constructor(zone: CardZone, cards: Card[] = []) {
    this.zone = zone;
    this.cards = [...cards];
  }

  has(card: Card): boolean {
    return this.cards.includes(card);
  }

  add(card: Card): void {
    this.cards.push(card);
  }

  remove(card: Card): boolean {
    const index = this.cards.indexOf(card);
    if (index < 0) return false;
    this.cards.splice(index, 1);
    return true;
  }
}

export class Deck extends CardPool {}
export class Hand extends CardPool {}
export class DiscardPile extends CardPool {}
export class SetAsidePile extends CardPool {}
export class ScoredPile extends CardPool {}

export class PlayerCardPools {
  objectiveDeck: Deck;
  objectiveHand: Hand;
  objectiveDiscard: DiscardPile;
  objectiveTempDiscard: SetAsidePile;
  objectiveScored: ScoredPile;
  powerDeck: Deck;
  powerHand: Hand;
  powerDiscard: DiscardPile;
  powerTempDiscard: SetAsidePile;

  constructor() {
    this.objectiveDeck = new Deck("objective-deck");
    this.objectiveHand = new Hand("objective-hand");
    this.objectiveDiscard = new DiscardPile("objective-discard");
    this.objectiveTempDiscard = new SetAsidePile("objective-temp-discard");
    this.objectiveScored = new ScoredPile("objective-scored");
    this.powerDeck = new Deck("power-deck");
    this.powerHand = new Hand("power-hand");
    this.powerDiscard = new DiscardPile("power-discard");
    this.powerTempDiscard = new SetAsidePile("power-temp-discard");
  }

  pool(zone: CardZone): CardPool {
    switch (zone) {
      case "objective-deck":
        return this.objectiveDeck;
      case "objective-hand":
        return this.objectiveHand;
      case "objective-discard":
        return this.objectiveDiscard;
      case "objective-temp-discard":
        return this.objectiveTempDiscard;
      case "objective-scored":
        return this.objectiveScored;
      case "power-deck":
        return this.powerDeck;
      case "power-hand":
        return this.powerHand;
      case "power-discard":
        return this.powerDiscard;
      case "power-temp-discard":
        return this.powerTempDiscard;
    }
  }
}
