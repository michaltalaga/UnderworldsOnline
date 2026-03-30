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

export abstract class ObjectiveCard extends Card {
  glory: number;

  constructor(owner: TeamId, name: string, zone: CardZone, glory: number) {
    super(owner, name, zone);
    this.glory = glory;
  }

  sameDefinition(other: Card): boolean {
    return super.sameDefinition(other) && other instanceof ObjectiveCard && this.glory === other.glory;
  }

  abstract isScored(state: GameState, team: TeamId): boolean;
}

export class HoldCenterObjectiveCard extends ObjectiveCard {
  ruleText(): string {
    return "Score this in an end phase if you hold the center objective.";
  }

  isScored(state: GameState, team: TeamId): boolean {
    const holderId = state.occupiedObjectives[hexKey({ q: 0, r: 0 })];
    const holder = holderId ? fighterById(state, holderId) : undefined;
    return !!holder && holder.hp > 0 && holder.team === team;
  }
}

export class TakeDownObjectiveCard extends ObjectiveCard {
  ruleText(): string {
    return "Score this in an end phase if your warband made a takedown this round.";
  }

  isScored(state: GameState, team: TeamId): boolean {
    return state.teams[team].roundTakedowns > 0;
  }
}

export class NoMercyObjectiveCard extends ObjectiveCard {
  ruleText(): string {
    return "Score this in an end phase if your warband made 2 or more successful attacks this round.";
  }

  isScored(state: GameState, team: TeamId): boolean {
    return state.teams[team].roundSuccessfulAttacks >= 2;
  }
}

export abstract class PowerCard extends Card {
  abstract legalActions(state: GameState, team: TeamId): PlayPowerCardAction[];
  abstract describeAction(state: GameState, action: PlayPowerCardAction): string;
  abstract play(state: GameState, action: PlayPowerCardAction): void;
}

export class FerociousStrikeCard extends PowerCard {
  ruleText(): string {
    return "Pick a friendly fighter. Their next attack has +1 Damage.";
  }

  legalActions(state: GameState, team: TeamId): PlayPowerCardAction[] {
    return liveTeamFighters(state, team).map((fighter) => ({
      type: "play-power",
      actorTeam: team,
      card: this,
      fighter,
    }));
  }

  describeAction(_state: GameState, action: PlayPowerCardAction): string {
    return `Play ${this.name} on ${action.fighter?.name ?? "fighter"}`;
  }

  play(state: GameState, action: PlayPowerCardAction): void {
    const fighter = action.fighter ? fighterById(state, action.fighter.id) : undefined;
    if (!fighter || fighter.team !== action.actorTeam || fighter.hp <= 0) return;
    fighter.weapon.nextAttackBonusDamage += 1;
    state.log.push({ turn: state.turnInRound, text: `${fighter.name} gains +1 damage on next attack` });
  }
}

export class HealingPotionCard extends PowerCard {
  ruleText(): string {
    return "Pick a friendly fighter. Heal 1.";
  }

  legalActions(state: GameState, team: TeamId): PlayPowerCardAction[] {
    return liveTeamFighters(state, team)
      .filter((fighter) => fighter.hp < fighter.maxHp)
      .map((fighter) => ({
        type: "play-power",
        actorTeam: team,
        card: this,
        fighter,
      }));
  }

  describeAction(_state: GameState, action: PlayPowerCardAction): string {
    return `Play ${this.name} on ${action.fighter?.name ?? "fighter"}`;
  }

  play(state: GameState, action: PlayPowerCardAction): void {
    const fighter = action.fighter ? fighterById(state, action.fighter.id) : undefined;
    if (!fighter || fighter.team !== action.actorTeam || fighter.hp <= 0) return;
    fighter.heal(1);
    state.log.push({ turn: state.turnInRound, text: `${fighter.name} heals 1` });
  }
}

export class SidestepCard extends PowerCard {
  ruleText(): string {
    return "Pick a friendly fighter. Push them 1 hex.";
  }

  legalActions(state: GameState, team: TeamId): PlayPowerCardAction[] {
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

  describeAction(_state: GameState, action: PlayPowerCardAction): string {
    return `Play ${this.name}: ${action.fighter?.name ?? "fighter"} -> ${action.targetHex ? boardCoordLabel(action.targetHex) : "hex"}`;
  }

  play(state: GameState, action: PlayPowerCardAction): void {
    const fighter = action.fighter ? fighterById(state, action.fighter.id) : undefined;
    const targetHex = action.targetHex;
    if (!fighter || !targetHex || fighter.team !== action.actorTeam || fighter.hp <= 0) return;
    if (!state.boardHexes.some((hex) => hex.q === targetHex.q && hex.r === targetHex.r)) return;
    if (hexDistance(fighter.position, targetHex) !== 1) return;
    if (occupantAt(state, targetHex)) return;
    fighter.position.q = targetHex.q;
    fighter.position.r = targetHex.r;
    state.log.push({ turn: state.turnInRound, text: `${fighter.name} uses ${this.name}` });
  }
}

export function createObjectiveCard(owner: TeamId, zone: CardZone, spec: { name: string; kind: ObjectiveCardKind; glory: number }): ObjectiveCard {
  switch (spec.kind) {
    case "hold-center":
      return new HoldCenterObjectiveCard(owner, spec.name, zone, spec.glory);
    case "take-down":
      return new TakeDownObjectiveCard(owner, spec.name, zone, spec.glory);
    case "no-mercy":
      return new NoMercyObjectiveCard(owner, spec.name, zone, spec.glory);
  }
}

export function createPowerCard(owner: TeamId, zone: CardZone, spec: { name: string; kind: PowerCardKind }): PowerCard {
  switch (spec.kind) {
    case "sidestep":
      return new SidestepCard(owner, spec.name, zone);
    case "ferocious-strike":
      return new FerociousStrikeCard(owner, spec.name, zone);
    case "healing-potion":
      return new HealingPotionCard(owner, spec.name, zone);
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
