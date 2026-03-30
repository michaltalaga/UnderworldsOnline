import { createBoardHexes } from "./boardShape";
import { rivalsObjectiveDeckById, rivalsPowerDeckById, starterWarbandById } from "./data/starterData";
import { hexKey } from "./hex";
import {
  Card,
  type CardId,
  Fighter,
  FighterCombatProfile,
  ObjectiveCardModel,
  PlayerAreas,
  PowerCardModel,
} from "./model";
import { rollD6, shuffleWithSeed } from "./rng";
import type { RivalsDeckId, WarbandId } from "./data/starterData";
import type { AttackDieFace, CardZone, FighterArchetype, FighterId, GameState, ObjectiveCard, PowerCard, TeamId } from "./types";

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

function addFighter(fighters: Record<FighterId, Fighter>, fighter: Fighter): void {
  fighters[fighter.id] = fighter;
}

function addCard(cards: Record<CardId, Card>, areas: PlayerAreas, card: Card): void {
  cards[card.id] = card;
  areas.area(card.zone).add(card.id);
}

function spawnFighter(team: TeamId, src: FighterArchetype, fighters: Record<FighterId, Fighter>): FighterId {
  const id = `${team}-${src.id}`;
  addFighter(
    fighters,
    new Fighter(
      id,
      team,
      src.name,
      src.pos,
      src.hp,
      src.stats.maxHp,
      new FighterCombatProfile(
        src.stats.move,
        src.stats.attackDice,
        src.stats.attackTrait,
        src.stats.attackRange,
        src.stats.attackDamage,
        src.stats.saveDice,
        src.stats.saveTrait,
      ),
    ),
  );
  return id;
}

function spawnCards(
  team: TeamId,
  kind: "objective" | "power",
  zone: CardZone,
  cards: ObjectiveCard[] | PowerCard[],
  cardMap: Record<CardId, Card>,
  areas: PlayerAreas,
  idCounter: { value: number },
): CardId[] {
  return cards.map((card, idx) => {
    const id = `${team}-${kind}-${zone}-${idx}-${idCounter.value}`;
    idCounter.value += 1;
    const gameCard =
      kind === "objective"
        ? new ObjectiveCardModel(id, team, card.name, zone, (card as ObjectiveCard).type, (card as ObjectiveCard).glory)
        : new PowerCardModel(id, team, card.name, zone, (card as PowerCard).type);
    addCard(cardMap, areas, gameCard);
    return id;
  });
}

function fighter(state: GameState, fighterId: FighterId): Fighter {
  const found = state.fighters[fighterId];
  if (!found) throw new Error(`Missing fighter: ${fighterId}`);
  return found;
}

function card(state: GameState, cardId: CardId): Card {
  const found = state.cards[cardId];
  if (!found) throw new Error(`Missing card: ${cardId}`);
  return found;
}

export function fighterIds(state: GameState, team?: TeamId): FighterId[] {
  if (team) return [...state.teams[team].fighterIds];
  return [...state.teams.red.fighterIds, ...state.teams.blue.fighterIds];
}

export function isAlive(state: GameState, fighterId: FighterId): boolean {
  return fighter(state, fighterId).hp > 0;
}

export function fighterName(state: GameState, fighterId: FighterId): string {
  return fighter(state, fighterId).name;
}

export function fighterTeam(state: GameState, fighterId: FighterId): TeamId {
  return fighter(state, fighterId).team;
}

export function fighterPos(state: GameState, fighterId: FighterId) {
  return fighter(state, fighterId).position;
}

export function fighterHealth(state: GameState, fighterId: FighterId) {
  return fighter(state, fighterId);
}

export function fighterCombat(state: GameState, fighterId: FighterId) {
  return fighter(state, fighterId).combat;
}

export function fighterStatus(state: GameState, fighterId: FighterId) {
  return fighter(state, fighterId).status;
}

export function cardName(state: GameState, cardId: CardId): string {
  return card(state, cardId).name;
}

export function cardIsObjective(state: GameState, cardId: CardId): boolean {
  return card(state, cardId) instanceof ObjectiveCardModel;
}

export function cardIsPower(state: GameState, cardId: CardId): boolean {
  return card(state, cardId) instanceof PowerCardModel;
}

export function cardObjectiveType(state: GameState, cardId: CardId) {
  const found = card(state, cardId);
  return found instanceof ObjectiveCardModel ? found.cardType : undefined;
}

export function cardPowerType(state: GameState, cardId: CardId) {
  const found = card(state, cardId);
  return found instanceof PowerCardModel ? found.cardType : undefined;
}

export function cardGloryValue(state: GameState, cardId: CardId): number {
  const found = card(state, cardId);
  return found instanceof ObjectiveCardModel ? found.glory : 0;
}

export function cardIdsInZone(state: GameState, team: TeamId, zone: CardZone): CardId[] {
  return [...state.areas[team].area(zone).cardIds];
}

export function moveCardToZone(state: GameState, cardId: CardId, zone: CardZone): void {
  const found = card(state, cardId);
  const ownerAreas = state.areas[found.owner];
  ownerAreas.area(found.zone).remove(cardId);
  found.zone = zone;
  ownerAreas.area(zone).add(cardId);
}

export function occupiedBy(state: GameState, q: number, r: number): FighterId | null {
  const found = fighterIds(state).find((id) => {
    if (!isAlive(state, id)) return false;
    const pos = fighterPos(state, id);
    return pos.q === q && pos.r === r;
  });
  return found ?? null;
}

export function objectiveOccupancy(state: GameState): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  state.objectiveHexes.forEach((h) => {
    out[hexKey(h)] = occupiedBy(state, h.q, h.r);
  });
  return out;
}

export function isBoardHex(state: GameState, q: number, r: number): boolean {
  return state.boardHexes.some((h) => h.q === q && h.r === r);
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
  const fighters: Record<FighterId, Fighter> = {};
  const cards: Record<CardId, Card> = {};
  const areas: Record<TeamId, PlayerAreas> = {
    red: new PlayerAreas(),
    blue: new PlayerAreas(),
  };
  const idCounter = { value: 1 };

  const redRoster = starterWarbandById(setup.redWarbandId).fighters.map((src) => spawnFighter("red", src, fighters));
  const blueRoster = starterWarbandById(setup.blueWarbandId).fighters.map((src) => spawnFighter("blue", src, fighters));

  const redObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.redRivalsDeckId), seed);
  const redPow = shuffleWithSeed(rivalsPowerDeckById(setup.redRivalsDeckId), redObj.seed);
  const blueObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.blueRivalsDeckId), redPow.seed);
  const bluePow = shuffleWithSeed(rivalsPowerDeckById(setup.blueRivalsDeckId), blueObj.seed);

  const redObjDraw = drawN(redObj.result, 3);
  const redPowDraw = drawN(redPow.result, 5);
  const blueObjDraw = drawN(blueObj.result, 3);
  const bluePowDraw = drawN(bluePow.result, 5);

  spawnCards("red", "objective", "objective-hand", redObjDraw.hand, cards, areas.red, idCounter);
  spawnCards("red", "objective", "objective-deck", redObjDraw.deck, cards, areas.red, idCounter);
  spawnCards("red", "power", "power-hand", redPowDraw.hand, cards, areas.red, idCounter);
  spawnCards("red", "power", "power-deck", redPowDraw.deck, cards, areas.red, idCounter);

  spawnCards("blue", "objective", "objective-hand", blueObjDraw.hand, cards, areas.blue, idCounter);
  spawnCards("blue", "objective", "objective-deck", blueObjDraw.deck, cards, areas.blue, idCounter);
  spawnCards("blue", "power", "power-hand", bluePowDraw.hand, cards, areas.blue, idCounter);
  spawnCards("blue", "power", "power-deck", bluePowDraw.deck, cards, areas.blue, idCounter);

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
    areas,
    teams: {
      red: {
        glory: 0,
        fighterIds: redRoster,
        mulliganUsed: false,
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
      blue: {
        glory: 0,
        fighterIds: blueRoster,
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

export function cloneState(state: GameState): GameState {
  const fighters: Record<FighterId, Fighter> = {};
  const cards: Record<CardId, Card> = {};

  Object.entries(state.fighters).forEach(([id, fighterValue]) => {
    fighters[id] = fighterValue.clone();
  });

  Object.entries(state.cards).forEach(([id, cardValue]) => {
    cards[id] = cardValue.clone();
  });

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
    areas: {
      red: state.areas.red.clone(),
      blue: state.areas.blue.clone(),
    },
    teams: {
      red: { ...state.teams.red, fighterIds: [...state.teams.red.fighterIds] },
      blue: { ...state.teams.blue, fighterIds: [...state.teams.blue.fighterIds] },
    },
    log: state.log.map((entry) => ({ ...entry })),
  };
}
