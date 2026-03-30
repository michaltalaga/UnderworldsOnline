import { boardCoordLabel } from "./coords";
import { hexKey, hexDistance, neighbors } from "./hex";
import type {
  AttackTrait,
  CardZone,
  GameState,
  Hex,
  ObjectiveCardKind,
  PlayPowerCardAction,
  PowerCardKind,
  SaveTrait,
  TeamId,
} from "./types";

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
  id: string;
  team: TeamId;
  name: string;
  position: Hex;
  hp: number;
  maxHp: number;
  weapon: Weapon;
  statuses: FighterStatus[];

  constructor(
    id: string,
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

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}

function fighterById(state: GameState, fighterId: string): Fighter | undefined {
  return state.fighters.find((fighter) => fighter.id === fighterId);
}

function occupantAt(state: GameState, hex: Hex): Fighter | undefined {
  return state.fighters.find((fighter) => fighter.hp > 0 && fighter.position.q === hex.q && fighter.position.r === hex.r);
}

function liveTeamFighters(state: GameState, team: TeamId): Fighter[] {
  return state.teams[team].fighters.filter((fighter) => fighter.hp > 0);
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

  abstract ruleText(): string;

  sameDefinition(other: Card): boolean {
    return this.constructor === other.constructor && this.owner === other.owner && this.name === other.name;
  }
}

export class ObjectiveCard extends Card {
  kind: ObjectiveCardKind;
  glory: number;

  constructor(owner: TeamId, name: string, zone: CardZone, kind: ObjectiveCardKind, glory: number) {
    super(owner, name, zone);
    this.kind = kind;
    this.glory = glory;
  }

  sameDefinition(other: Card): boolean {
    return super.sameDefinition(other) && other instanceof ObjectiveCard && this.kind === other.kind && this.glory === other.glory;
  }

  ruleText(): string {
    switch (this.kind) {
      case "hold-center":
        return "Score this in an end phase if you hold the center objective.";
      case "take-down":
        return "Score this in an end phase if your warband made a takedown this round.";
      case "no-mercy":
        return "Score this in an end phase if your warband made 2 or more successful attacks this round.";
    }
  }

  isScored(state: GameState, team: TeamId): boolean {
    switch (this.kind) {
      case "hold-center": {
        const holderId = state.occupiedObjectives[hexKey({ q: 0, r: 0 })];
        const holder = holderId ? fighterById(state, holderId) : undefined;
        return !!holder && holder.hp > 0 && holder.team === team;
      }
      case "take-down":
        return state.teams[team].roundTakedowns > 0;
      case "no-mercy":
        return state.teams[team].roundSuccessfulAttacks >= 2;
    }
  }
}

export class PowerCard extends Card {
  kind: PowerCardKind;

  constructor(owner: TeamId, name: string, zone: CardZone, kind: PowerCardKind) {
    super(owner, name, zone);
    this.kind = kind;
  }

  sameDefinition(other: Card): boolean {
    return super.sameDefinition(other) && other instanceof PowerCard && this.kind === other.kind;
  }

  ruleText(): string {
    switch (this.kind) {
      case "ferocious-strike":
        return "Pick a friendly fighter. Their next attack has +1 Damage.";
      case "healing-potion":
        return "Pick a friendly fighter. Heal 1.";
      case "sidestep":
        return "Pick a friendly fighter. Push them 1 hex.";
    }
  }

  legalActions(state: GameState, team: TeamId): PlayPowerCardAction[] {
    switch (this.kind) {
      case "ferocious-strike":
        return liveTeamFighters(state, team).map((fighter) => ({
          type: "play-power",
          actorTeam: team,
          card: this,
          fighter,
        }));
      case "healing-potion":
        return liveTeamFighters(state, team)
          .filter((fighter) => fighter.hp < fighter.maxHp)
          .map((fighter) => ({
            type: "play-power",
            actorTeam: team,
            card: this,
            fighter,
          }));
      case "sidestep":
        return liveTeamFighters(state, team).flatMap((fighter) =>
          neighbors(fighter.position)
            .filter((hex) => state.boardHexes.some((boardHex) => boardHex.q === hex.q && boardHex.r === hex.r))
            .filter((hex) => occupantAt(state, hex) === undefined)
            .map((targetHex) => ({
              type: "play-power",
              actorTeam: team,
              card: this,
              fighter,
              targetHex,
            })),
        );
    }
  }

  describeAction(_state: GameState, action: PlayPowerCardAction): string {
    if (this.kind === "sidestep") {
      return `Play ${this.name}: ${action.fighter?.name ?? "fighter"} -> ${action.targetHex ? boardCoordLabel(action.targetHex) : "hex"}`;
    }
    return `Play ${this.name} on ${action.fighter?.name ?? "fighter"}`;
  }

  play(state: GameState, action: PlayPowerCardAction): void {
    const fighter = action.fighter ? fighterById(state, action.fighter.id) : undefined;

    switch (this.kind) {
      case "ferocious-strike":
        if (!fighter || fighter.team !== action.actorTeam || fighter.hp <= 0) return;
        fighter.weapon.nextAttackBonusDamage += 1;
        state.log.push({ turn: state.turnInRound, text: `${fighter.name} gains +1 damage on next attack` });
        return;
      case "healing-potion":
        if (!fighter || fighter.team !== action.actorTeam || fighter.hp <= 0) return;
        fighter.heal(1);
        state.log.push({ turn: state.turnInRound, text: `${fighter.name} heals 1` });
        return;
      case "sidestep": {
        const targetHex = action.targetHex;
        if (!fighter || !targetHex || fighter.team !== action.actorTeam || fighter.hp <= 0) return;
        if (!state.boardHexes.some((hex) => hex.q === targetHex.q && hex.r === targetHex.r)) return;
        if (hexDistance(fighter.position, targetHex) !== 1) return;
        if (occupantAt(state, targetHex)) return;
        fighter.position.q = targetHex.q;
        fighter.position.r = targetHex.r;
        state.log.push({ turn: state.turnInRound, text: `${fighter.name} uses ${this.name}` });
        return;
      }
    }
  }
}

export class CardPool {
  zone: CardZone;
  cards: Card[];

  constructor(zone: CardZone, cards: Card[] = []) {
    this.zone = zone;
    this.cards = [...cards];
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
