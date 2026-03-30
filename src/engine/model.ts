import type {
  AttackTrait,
  CardZone,
  FighterId,
  Hex,
  ObjectiveCardType,
  PowerCardType,
  SaveTrait,
  TeamId,
} from "./types";

export type CardId = string;

export class FighterCombatProfile {
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

  clone(): FighterCombatProfile {
    return new FighterCombatProfile(
      this.move,
      this.attackDice,
      this.attackTrait,
      this.attackRange,
      this.attackDamage,
      this.saveDice,
      this.saveTrait,
      this.nextAttackBonusDamage,
    );
  }
}

export class FighterStatus {
  guard: boolean;
  charged: boolean;

  constructor(guard = false, charged = false) {
    this.guard = guard;
    this.charged = charged;
  }

  clone(): FighterStatus {
    return new FighterStatus(this.guard, this.charged);
  }
}

export class Fighter {
  id: FighterId;
  team: TeamId;
  name: string;
  position: Hex;
  hp: number;
  maxHp: number;
  combat: FighterCombatProfile;
  status: FighterStatus;

  constructor(
    id: FighterId,
    team: TeamId,
    name: string,
    position: Hex,
    hp: number,
    maxHp: number,
    combat: FighterCombatProfile,
    status = new FighterStatus(),
  ) {
    this.id = id;
    this.team = team;
    this.name = name;
    this.position = { ...position };
    this.hp = hp;
    this.maxHp = maxHp;
    this.combat = combat;
    this.status = status;
  }

  clone(): Fighter {
    return new Fighter(
      this.id,
      this.team,
      this.name,
      { ...this.position },
      this.hp,
      this.maxHp,
      this.combat.clone(),
      this.status.clone(),
    );
  }
}

export abstract class Card {
  id: CardId;
  owner: TeamId;
  name: string;
  zone: CardZone;

  constructor(id: CardId, owner: TeamId, name: string, zone: CardZone) {
    this.id = id;
    this.owner = owner;
    this.name = name;
    this.zone = zone;
  }

  abstract clone(): Card;
}

export class ObjectiveCardModel extends Card {
  cardType: ObjectiveCardType;
  glory: number;

  constructor(id: CardId, owner: TeamId, name: string, zone: CardZone, cardType: ObjectiveCardType, glory: number) {
    super(id, owner, name, zone);
    this.cardType = cardType;
    this.glory = glory;
  }

  clone(): ObjectiveCardModel {
    return new ObjectiveCardModel(this.id, this.owner, this.name, this.zone, this.cardType, this.glory);
  }
}

export class PowerCardModel extends Card {
  cardType: PowerCardType;

  constructor(id: CardId, owner: TeamId, name: string, zone: CardZone, cardType: PowerCardType) {
    super(id, owner, name, zone);
    this.cardType = cardType;
  }

  clone(): PowerCardModel {
    return new PowerCardModel(this.id, this.owner, this.name, this.zone, this.cardType);
  }
}

export class CardArea {
  zone: CardZone;
  cardIds: CardId[];

  constructor(zone: CardZone, cardIds: CardId[] = []) {
    this.zone = zone;
    this.cardIds = [...cardIds];
  }

  has(cardId: CardId): boolean {
    return this.cardIds.includes(cardId);
  }

  add(cardId: CardId): void {
    this.cardIds.push(cardId);
  }

  addMany(cardIds: CardId[]): void {
    this.cardIds.push(...cardIds);
  }

  remove(cardId: CardId): boolean {
    const index = this.cardIds.indexOf(cardId);
    if (index < 0) return false;
    this.cardIds.splice(index, 1);
    return true;
  }

  draw(count: number): CardId[] {
    return this.cardIds.splice(0, count);
  }

  clone(): CardArea {
    return new CardArea(this.zone, this.cardIds);
  }
}

export class Deck extends CardArea {
  clone(): Deck {
    return new Deck(this.zone, this.cardIds);
  }
}

export class Hand extends CardArea {
  clone(): Hand {
    return new Hand(this.zone, this.cardIds);
  }
}

export class DiscardPile extends CardArea {
  clone(): DiscardPile {
    return new DiscardPile(this.zone, this.cardIds);
  }
}

export class SetAsidePile extends CardArea {
  clone(): SetAsidePile {
    return new SetAsidePile(this.zone, this.cardIds);
  }
}

export class ScoredPile extends CardArea {
  clone(): ScoredPile {
    return new ScoredPile(this.zone, this.cardIds);
  }
}

export class PlayerAreas {
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

  area(zone: CardZone): CardArea {
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

  clone(): PlayerAreas {
    const next = new PlayerAreas();
    next.objectiveDeck = this.objectiveDeck.clone();
    next.objectiveHand = this.objectiveHand.clone();
    next.objectiveDiscard = this.objectiveDiscard.clone();
    next.objectiveTempDiscard = this.objectiveTempDiscard.clone();
    next.objectiveScored = this.objectiveScored.clone();
    next.powerDeck = this.powerDeck.clone();
    next.powerHand = this.powerHand.clone();
    next.powerDiscard = this.powerDiscard.clone();
    next.powerTempDiscard = this.powerTempDiscard.clone();
    return next;
  }
}
