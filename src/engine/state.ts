import { hexKey } from "./hex";
import { starterObjectiveDeck, starterPowerDeck, starterWarbandById } from "./data/starterData";
import { rollD6, shuffleWithSeed } from "./rng";
import { createBoardHexes } from "./boardShape";
import type { WarbandId } from "./data/starterData";
import type { FighterEntity, GameState, TeamId } from "./types";

type InitialStateSetup = {
  redWarbandId: WarbandId;
  blueWarbandId: WarbandId;
};

function prefixedFighters(team: TeamId, warbandId: WarbandId): Record<string, FighterEntity> {
  const wb = starterWarbandById(warbandId);
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

function determineFirstTeam(rngState: number): {
  rngState: number;
  firstTeam: TeamId;
  redRoll: number;
  blueRoll: number;
} {
  let state = rngState;

  // Embergard uses a roll-off to decide who has the first activation.
  while (true) {
    const red = rollD6(state);
    const blue = rollD6(red.state);
    state = blue.state;
    if (red.value === blue.value) continue;

    return {
      rngState: state,
      firstTeam: red.value > blue.value ? "red" : "blue",
      redRoll: red.value,
      blueRoll: blue.value,
    };
  }
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

export function initialState(
  seed = 1337,
  setup: InitialStateSetup = { redWarbandId: "emberguard", blueWarbandId: "duskraiders" },
): GameState {
  const redFighters = prefixedFighters("red", setup.redWarbandId);
  const blueFighters = prefixedFighters("blue", setup.blueWarbandId);
  const allFighters = { ...redFighters, ...blueFighters };

  const redObj = shuffleWithSeed(starterObjectiveDeck(), seed);
  const redPow = shuffleWithSeed(starterPowerDeck(), redObj.seed);
  const blueObj = shuffleWithSeed(starterObjectiveDeck(), redPow.seed);
  const bluePow = shuffleWithSeed(starterPowerDeck(), blueObj.seed);

  const redObjDraw = drawN(redObj.result, 3);
  const redPowDraw = drawN(redPow.result, 5);
  const blueObjDraw = drawN(blueObj.result, 3);
  const bluePowDraw = drawN(bluePow.result, 5);
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
    components: {
      fighters: allFighters,
    },
    teams: {
      red: {
        glory: 0,
        fighters: Object.keys(redFighters),
        objectiveDeck: redObjDraw.deck,
        objectiveHand: redObjDraw.hand,
        objectiveDiscard: [],
        objectiveTempDiscard: [],
        scoredObjectives: [],
        powerDeck: redPowDraw.deck,
        powerHand: redPowDraw.hand,
        discardPower: [],
        powerTempDiscard: [],
        mulliganUsed: false,
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
      blue: {
        glory: 0,
        fighters: Object.keys(blueFighters),
        objectiveDeck: blueObjDraw.deck,
        objectiveHand: blueObjDraw.hand,
        objectiveDiscard: [],
        objectiveTempDiscard: [],
        scoredObjectives: [],
        powerDeck: bluePowDraw.deck,
        powerHand: bluePowDraw.hand,
        discardPower: [],
        powerTempDiscard: [],
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
