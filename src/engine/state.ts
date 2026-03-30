import { createBoardHexes } from "./boardShape";
import { rivalsObjectiveDeckById, rivalsPowerDeckById, starterWarbandById } from "./data/starterData";
import { hexKey } from "./hex";
import {
  Card,
  CardPool,
  Deck,
  DiscardPile,
  FerociousStrikeCard,
  Fighter,
  HealingPotionCard,
  HoldCenterObjectiveCard,
  NoMercyObjectiveCard,
  createObjectiveCard,
  createPowerCard,
  type FighterStatus,
  Hand,
  ObjectiveCard,
  PlayerCardPools,
  ScoredPile,
  SidestepCard,
  SetAsidePile,
  TakeDownObjectiveCard,
  Weapon,
} from "./model";
import { rollD6, shuffleWithSeed } from "./rng";
import type { RivalsDeckId, WarbandId } from "./data/starterData";
import type {
  AttackDieFace,
  CardZone,
  FighterArchetype,
  GameState,
  ObjectiveCardSpec,
  PowerCardSpec,
  TeamId,
} from "./types";

type InitialStateSetup = {
  redWarbandId: WarbandId;
  blueWarbandId: WarbandId;
  redRivalsDeckId: RivalsDeckId;
  blueRivalsDeckId: RivalsDeckId;
};

function drawN<T>(arr: T[], n: number): { hand: T[]; deck: T[] } {
  return { hand: arr.slice(0, n), deck: arr.slice(n) };
}

function rollAttackDieFace(rngState: number): { state: number; face: AttackDieFace } {
  const roll = rollD6(rngState);
  if (roll.value === 6) return { state: roll.state, face: "crit-attack" };
  if (roll.value === 5) return { state: roll.state, face: "hammer" };
  if (roll.value === 4) return { state: roll.state, face: "sword" };
  if (roll.value === 3) return { state: roll.state, face: "double-support" };
  if (roll.value === 2) return { state: roll.state, face: "support" };
  return { state: roll.state, face: "blank" };
}

function rollOffRank(face: AttackDieFace): number {
  if (face === "crit-attack") return 3;
  if (face === "hammer" || face === "sword") return 2;
  if (face === "support" || face === "double-support") return 1;
  return 0;
}

function determineFirstTeam(rngState: number): {
  rngState: number;
  firstTeam: TeamId;
  redRoll: AttackDieFace;
  blueRoll: AttackDieFace;
} {
  let state = rngState;

  while (true) {
    const red = rollAttackDieFace(state);
    const blue = rollAttackDieFace(red.state);
    state = blue.state;
    const redRank = rollOffRank(red.face);
    const blueRank = rollOffRank(blue.face);
    if (redRank === blueRank) continue;

    return {
      rngState: state,
      firstTeam: redRank > blueRank ? "red" : "blue",
      redRoll: red.face,
      blueRoll: blue.face,
    };
  }
}

function addFighter(roster: Fighter[], fighter: Fighter): void {
  roster.push(fighter);
}

function addCard(cards: Card[], pool: CardPool, card: Card): void {
  cards.push(card);
  pool.add(card);
}

function poolsFor(state: GameState, team: TeamId): PlayerCardPools {
  return state.cardPools[team];
}

function fighterById(state: GameState, fighterId: string): Fighter {
  const found = state.fighters.find((fighter) => fighter.id === fighterId);
  if (!found) throw new Error(`Missing fighter: ${fighterId}`);
  return found;
}

function spawnFighter(team: TeamId, src: FighterArchetype, fighters: Fighter[]): Fighter {
  const fighter = new Fighter(
    `${team}-${src.id}`,
    team,
    src.name,
    src.pos,
    src.hp,
    src.stats.maxHp,
    new Weapon(
      src.stats.move,
      src.stats.attackDice,
      src.stats.attackTrait,
      src.stats.attackRange,
      src.stats.attackDamage,
      src.stats.saveDice,
      src.stats.saveTrait,
    ),
  );
  addFighter(fighters, fighter);
  return fighter;
}

function spawnCards(
  team: TeamId,
  kind: "objective" | "power",
  zone: CardZone,
  sourceCards: ObjectiveCardSpec[] | PowerCardSpec[],
  cards: Card[],
  pools: PlayerCardPools,
): Card[] {
  return sourceCards.map((sourceCard) => {
    const gameCard =
      kind === "objective"
        ? createObjectiveCard(team, zone, sourceCard as ObjectiveCardSpec)
        : createPowerCard(team, zone, sourceCard as PowerCardSpec);
    addCard(cards, pools.pool(zone), gameCard);
    return gameCard;
  });
}

export function fightersForTeam(state: GameState, team?: TeamId): Fighter[] {
  if (team) return [...state.teams[team].fighters];
  return [...state.fighters];
}

export function isAlive(state: GameState, fighterOrId: Fighter | string): boolean {
  const fighter = typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId;
  return fighter.hp > 0;
}

export function fighterName(state: GameState, fighterOrId: Fighter | string): string {
  return (typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId).name;
}

export function fighterTeam(state: GameState, fighterOrId: Fighter | string): TeamId {
  return (typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId).team;
}

export function fighterPos(state: GameState, fighterOrId: Fighter | string) {
  return (typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId).position;
}

export function fighterHealth(state: GameState, fighterOrId: Fighter | string) {
  return typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId;
}

export function fighterWeapon(state: GameState, fighterOrId: Fighter | string) {
  return (typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId).weapon;
}

export function fighterStatuses(state: GameState, fighterOrId: Fighter | string) {
  return (typeof fighterOrId === "string" ? fighterById(state, fighterOrId) : fighterOrId).statuses;
}

export function hasStatus(state: GameState, fighterOrId: Fighter | string, status: FighterStatus): boolean {
  return fighterStatuses(state, fighterOrId).includes(status);
}

export function addStatus(state: GameState, fighterOrId: Fighter | string, status: FighterStatus): void {
  const statuses = fighterStatuses(state, fighterOrId);
  if (!statuses.includes(status)) statuses.push(status);
}

export function removeStatus(state: GameState, fighterOrId: Fighter | string, status: FighterStatus): void {
  const statuses = fighterStatuses(state, fighterOrId);
  const index = statuses.indexOf(status);
  if (index >= 0) statuses.splice(index, 1);
}

export function cardName(_state: GameState, card: Card): string {
  return card.name;
}

export function cardIsObjective(_state: GameState, card: Card): boolean {
  return card instanceof ObjectiveCard;
}

export function cardRuleText(_state: GameState, card: Card): string {
  return card.ruleText();
}

export function cardGloryValue(_state: GameState, card: Card): number {
  return card instanceof ObjectiveCard ? card.glory : 0;
}

export function cardsInZone(state: GameState, team: TeamId, zone: CardZone): Card[] {
  return [...poolsFor(state, team).pool(zone).cards];
}

export function moveCardToZone(state: GameState, card: Card, zone: CardZone): void {
  const pools = poolsFor(state, card.owner);
  pools.pool(card.zone).remove(card);
  card.zone = zone;
  pools.pool(zone).add(card);
}

export function occupiedBy(state: GameState, q: number, r: number): Fighter | null {
  const found = state.fighters.find((fighter) => isAlive(state, fighter) && fighter.position.q === q && fighter.position.r === r);
  return found ?? null;
}

export function objectiveOccupancy(state: GameState): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  state.objectiveHexes.forEach((hex) => {
    out[hexKey(hex)] = occupiedBy(state, hex.q, hex.r)?.id ?? null;
  });
  return out;
}

export function isBoardHex(state: GameState, q: number, r: number): boolean {
  return state.boardHexes.some((hex) => hex.q === q && hex.r === r);
}

export function initialState(
  seed = 1337,
  setup: InitialStateSetup = {
    redWarbandId: "emberguard",
    blueWarbandId: "duskraiders",
    redRivalsDeckId: "blazing-assault",
    blueRivalsDeckId: "emberstone-hold",
  },
): GameState {
  const fighters: Fighter[] = [];
  const cards: Card[] = [];
  const cardPools: Record<TeamId, PlayerCardPools> = {
    red: new PlayerCardPools(),
    blue: new PlayerCardPools(),
  };

  const redRoster = starterWarbandById(setup.redWarbandId).fighters.map((source) => spawnFighter("red", source, fighters));
  const blueRoster = starterWarbandById(setup.blueWarbandId).fighters.map((source) => spawnFighter("blue", source, fighters));

  const redObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.redRivalsDeckId), seed);
  const redPow = shuffleWithSeed(rivalsPowerDeckById(setup.redRivalsDeckId), redObj.seed);
  const blueObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.blueRivalsDeckId), redPow.seed);
  const bluePow = shuffleWithSeed(rivalsPowerDeckById(setup.blueRivalsDeckId), blueObj.seed);

  const redObjDraw = drawN(redObj.result, 3);
  const redPowDraw = drawN(redPow.result, 5);
  const blueObjDraw = drawN(blueObj.result, 3);
  const bluePowDraw = drawN(bluePow.result, 5);

  spawnCards("red", "objective", "objective-hand", redObjDraw.hand, cards, cardPools.red);
  spawnCards("red", "objective", "objective-deck", redObjDraw.deck, cards, cardPools.red);
  spawnCards("red", "power", "power-hand", redPowDraw.hand, cards, cardPools.red);
  spawnCards("red", "power", "power-deck", redPowDraw.deck, cards, cardPools.red);
  spawnCards("blue", "objective", "objective-hand", blueObjDraw.hand, cards, cardPools.blue);
  spawnCards("blue", "objective", "objective-deck", blueObjDraw.deck, cards, cardPools.blue);
  spawnCards("blue", "power", "power-hand", bluePowDraw.hand, cards, cardPools.blue);
  spawnCards("blue", "power", "power-deck", bluePowDraw.deck, cards, cardPools.blue);

  const firstRoll = determineFirstTeam(bluePow.seed);

  const state: GameState = {
    seed,
    rngState: firstRoll.rngState,
    round: 1,
    turnInRound: 1,
    activeTeam: firstRoll.firstTeam,
    firstTeam: firstRoll.firstTeam,
    powerPriorityTeam: firstRoll.firstTeam,
    powerPassCount: 0,
    turnStep: "action",
    winner: null,
    boardHexes: createBoardHexes(),
    objectiveHexes: [{ q: 0, r: 0 }, { q: -1, r: 0 }, { q: 1, r: 0 }],
    occupiedObjectives: {},
    diceRollEvent: null,
    fighters,
    cards,
    cardPools,
    teams: {
      red: {
        glory: 0,
        fighters: redRoster,
        mulliganUsed: false,
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
      blue: {
        glory: 0,
        fighters: blueRoster,
        mulliganUsed: false,
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
    },
    log: [
      {
        turn: 1,
        text: `Match started (roll-off red ${firstRoll.redRoll} vs blue ${firstRoll.blueRoll}; ${firstRoll.firstTeam} starts)`,
      },
    ],
  };

  state.occupiedObjectives = objectiveOccupancy(state);
  return state;
}

export function boardHexes(state: GameState) {
  return state.boardHexes;
}

function clonePool(pool: CardPool, cards: Map<Card, Card>): CardPool {
  const clonedCards = pool.cards.map((card) => cards.get(card)!);
  if (pool instanceof Deck) return new Deck(pool.zone, clonedCards);
  if (pool instanceof Hand) return new Hand(pool.zone, clonedCards);
  if (pool instanceof DiscardPile) return new DiscardPile(pool.zone, clonedCards);
  if (pool instanceof SetAsidePile) return new SetAsidePile(pool.zone, clonedCards);
  if (pool instanceof ScoredPile) return new ScoredPile(pool.zone, clonedCards);
  return new CardPool(pool.zone, clonedCards);
}

function cloneCardPools(source: PlayerCardPools, cards: Map<Card, Card>): PlayerCardPools {
  const next = new PlayerCardPools();
  next.objectiveDeck = clonePool(source.objectiveDeck, cards) as Deck;
  next.objectiveHand = clonePool(source.objectiveHand, cards) as Hand;
  next.objectiveDiscard = clonePool(source.objectiveDiscard, cards) as DiscardPile;
  next.objectiveTempDiscard = clonePool(source.objectiveTempDiscard, cards) as SetAsidePile;
  next.objectiveScored = clonePool(source.objectiveScored, cards) as ScoredPile;
  next.powerDeck = clonePool(source.powerDeck, cards) as Deck;
  next.powerHand = clonePool(source.powerHand, cards) as Hand;
  next.powerDiscard = clonePool(source.powerDiscard, cards) as DiscardPile;
  next.powerTempDiscard = clonePool(source.powerTempDiscard, cards) as SetAsidePile;
  return next;
}

function cloneCard(card: Card): Card {
  if (card instanceof HoldCenterObjectiveCard) return new HoldCenterObjectiveCard(card.owner, card.name, card.zone, card.glory);
  if (card instanceof TakeDownObjectiveCard) return new TakeDownObjectiveCard(card.owner, card.name, card.zone, card.glory);
  if (card instanceof NoMercyObjectiveCard) return new NoMercyObjectiveCard(card.owner, card.name, card.zone, card.glory);
  if (card instanceof SidestepCard) return new SidestepCard(card.owner, card.name, card.zone);
  if (card instanceof FerociousStrikeCard) return new FerociousStrikeCard(card.owner, card.name, card.zone);
  if (card instanceof HealingPotionCard) return new HealingPotionCard(card.owner, card.name, card.zone);
  throw new Error(`Unsupported card class: ${card.constructor.name}`);
}

export function cloneState(state: GameState): GameState {
  const fighters = state.fighters.map(
    (fighter) =>
      new Fighter(
        fighter.id,
        fighter.team,
        fighter.name,
        { ...fighter.position },
        fighter.hp,
        fighter.maxHp,
        new Weapon(
          fighter.weapon.move,
          fighter.weapon.attackDice,
          fighter.weapon.attackTrait,
          fighter.weapon.attackRange,
          fighter.weapon.attackDamage,
          fighter.weapon.saveDice,
          fighter.weapon.saveTrait,
          fighter.weapon.nextAttackBonusDamage,
        ),
        [...fighter.statuses],
      ),
  );
  const fighterMap = new Map(state.fighters.map((fighter, index) => [fighter, fighters[index]]));
  const cards = state.cards.map(cloneCard);
  const cardMap = new Map(state.cards.map((card, index) => [card, cards[index]]));

  return {
    seed: state.seed,
    rngState: state.rngState,
    round: state.round,
    turnInRound: state.turnInRound,
    activeTeam: state.activeTeam,
    firstTeam: state.firstTeam,
    powerPriorityTeam: state.powerPriorityTeam,
    powerPassCount: state.powerPassCount,
    turnStep: state.turnStep,
    winner: state.winner,
    boardHexes: state.boardHexes.map((hex) => ({ ...hex })),
    objectiveHexes: state.objectiveHexes.map((hex) => ({ ...hex })),
    occupiedObjectives: { ...state.occupiedObjectives },
    diceRollEvent: state.diceRollEvent
      ? {
          ...state.diceRollEvent,
          attackFaces: state.diceRollEvent.attackFaces.map((face) => ({ ...face })),
          defenseFaces: state.diceRollEvent.defenseFaces.map((face) => ({ ...face })),
        }
      : null,
    fighters,
    cards,
    cardPools: {
      red: cloneCardPools(state.cardPools.red, cardMap),
      blue: cloneCardPools(state.cardPools.blue, cardMap),
    },
    teams: {
      red: { ...state.teams.red, fighters: state.teams.red.fighters.map((fighter) => fighterMap.get(fighter)!) },
      blue: { ...state.teams.blue, fighters: state.teams.blue.fighters.map((fighter) => fighterMap.get(fighter)!) },
    },
    log: state.log.map((entry) => ({ ...entry })),
  };
}
