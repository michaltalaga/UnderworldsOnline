import { hexKey } from "./hex";
import { starterObjectiveDeck, starterPowerDeck, starterWarband } from "./data/starterData";
import { shuffleWithSeed } from "./rng";
import type { FighterEntity, GameState, TeamId } from "./types";

const BOARD_ROW_COUNTS = [6, 7, 8, 9, 8, 9, 8, 9, 8, 7, 6] as const;

function createBoardHexes() {
  const rows = BOARD_ROW_COUNTS.length;
  const centerRow = Math.floor(rows / 2);
  const out: Array<{ q: number; r: number }> = [];

  BOARD_ROW_COUNTS.forEach((count, rowIndex) => {
    const r = rowIndex - centerRow;
    const qStart = -Math.floor(count / 2);
    for (let i = 0; i < count; i += 1) {
      out.push({ q: qStart + i, r });
    }
  });

  return out;
}

function prefixedFighters(team: TeamId): Record<string, FighterEntity> {
  const wb = starterWarband(team);
  const out: Record<string, FighterEntity> = {};
  wb.fighters.forEach((f) => {
    const id = `${team}-${f.id}`;
    out[id] = { ...f, id, team };
  });
  return out;
}

function drawN<T>(arr: T[], n: number): { hand: T[]; deck: T[] } {
  return { hand: arr.slice(0, n), deck: arr.slice(n) };
}

export function isAlive(f: FighterEntity): boolean {
  return f.hp > 0;
}

export function occupiedBy(state: GameState, q: number, r: number): string | null {
  const fighters = Object.values(state.components.fighters);
  const found = fighters.find((f) => isAlive(f) && f.pos.q === q && f.pos.r === r);
  return found ? found.id : null;
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

export function initialState(seed = 1337): GameState {
  const redFighters = prefixedFighters("red");
  const blueFighters = prefixedFighters("blue");
  const allFighters = { ...redFighters, ...blueFighters };

  const redObj = shuffleWithSeed(starterObjectiveDeck(), seed);
  const redPow = shuffleWithSeed(starterPowerDeck(), redObj.seed);
  const blueObj = shuffleWithSeed(starterObjectiveDeck(), redPow.seed);
  const bluePow = shuffleWithSeed(starterPowerDeck(), blueObj.seed);

  const redObjDraw = drawN(redObj.result, 3);
  const redPowDraw = drawN(redPow.result, 5);
  const blueObjDraw = drawN(blueObj.result, 3);
  const bluePowDraw = drawN(bluePow.result, 5);

  const state: GameState = {
    seed,
    rngState: bluePow.seed,
    round: 1,
    turnInRound: 1,
    activeTeam: "red",
    firstTeam: "red",
    turnStep: "action",
    winner: null,
    boardHexes: createBoardHexes(),
    objectiveHexes: [{ q: 0, r: 0 }, { q: -1, r: 0 }, { q: 1, r: 0 }],
    occupiedObjectives: {},
    components: {
      fighters: allFighters,
    },
    teams: {
      red: {
        glory: 0,
        fighters: Object.keys(redFighters),
        objectiveDeck: redObjDraw.deck,
        objectiveHand: redObjDraw.hand,
        scoredObjectives: [],
        powerDeck: redPowDraw.deck,
        powerHand: redPowDraw.hand,
        discardPower: [],
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
      blue: {
        glory: 0,
        fighters: Object.keys(blueFighters),
        objectiveDeck: blueObjDraw.deck,
        objectiveHand: blueObjDraw.hand,
        scoredObjectives: [],
        powerDeck: bluePowDraw.deck,
        powerHand: bluePowDraw.hand,
        discardPower: [],
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
    },
    log: [{ turn: 1, text: "Match started" }],
  };

  state.occupiedObjectives = objectiveOccupancy(state);
  return state;
}

export function boardHexes(state: GameState) {
  return state.boardHexes;
}
