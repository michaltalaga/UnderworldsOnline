import { shuffleWithSeed } from "../rng";
import type { GameState, TeamId } from "../types";

function canMulliganWindow(state: GameState): boolean {
  return state.round === 1 && state.turnInRound === 1;
}

export function isMulliganPending(state: GameState, team: TeamId): boolean {
  const t = state.teams[team];
  return t.objectiveTempDiscard.length > 0 || t.powerTempDiscard.length > 0;
}

export function canStartMulligan(state: GameState, team: TeamId): boolean {
  if (!canMulliganWindow(state)) return false;
  if (state.winner) return false;
  const t = state.teams[team];
  return !t.mulliganUsed && !isMulliganPending(state, team);
}

export function startMulligan(state: GameState, team: TeamId): void {
  if (!canStartMulligan(state, team)) return;

  const t = state.teams[team];

  t.objectiveTempDiscard.push(...t.objectiveHand);
  t.objectiveHand = [];
  while (t.objectiveHand.length < 3 && t.objectiveDeck.length > 0) {
    const next = t.objectiveDeck.shift();
    if (next) t.objectiveHand.push(next);
  }

  t.powerTempDiscard.push(...t.powerHand);
  t.powerHand = [];
  while (t.powerHand.length < 5 && t.powerDeck.length > 0) {
    const next = t.powerDeck.shift();
    if (next) t.powerHand.push(next);
  }
}

export function resolveMulligan(state: GameState, team: TeamId): void {
  const t = state.teams[team];
  if (!isMulliganPending(state, team)) return;

  if (t.objectiveTempDiscard.length > 0) {
    const shuffled = shuffleWithSeed([...t.objectiveDeck, ...t.objectiveTempDiscard], state.rngState);
    state.rngState = shuffled.seed;
    t.objectiveDeck = shuffled.result;
    t.objectiveTempDiscard = [];
  }

  if (t.powerTempDiscard.length > 0) {
    const shuffled = shuffleWithSeed([...t.powerDeck, ...t.powerTempDiscard], state.rngState);
    state.rngState = shuffled.seed;
    t.powerDeck = shuffled.result;
    t.powerTempDiscard = [];
  }

  t.mulliganUsed = true;
}
