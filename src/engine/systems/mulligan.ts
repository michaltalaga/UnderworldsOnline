import { nextRng } from "../rng";
import type { Card } from "../model";
import { cardsInZone, moveCardToZone } from "../state";
import type { GameState, TeamId } from "../types";

function canMulliganWindow(state: GameState): boolean {
  return state.round === 1 && state.turnInRound === 1;
}

function shuffleCards(cards: Card[], seed: number): { seed: number; result: Card[] } {
  const out = [...cards];
  let state = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    const next = nextRng(state);
    state = next.state;
    const j = Math.floor(next.value * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { seed: state, result: out };
}

function drawObjectivesToThree(state: GameState, team: TeamId): void {
  const hand = cardsInZone(state, team, "objective-hand");
  if (hand.length >= 3) return;
  const deck = cardsInZone(state, team, "objective-deck");
  const toDraw = Math.min(3 - hand.length, deck.length);
  deck.slice(0, toDraw).forEach((card) => moveCardToZone(state, card, "objective-hand"));
}

function drawPowerToFive(state: GameState, team: TeamId): void {
  const hand = cardsInZone(state, team, "power-hand");
  if (hand.length >= 5) return;
  const deck = cardsInZone(state, team, "power-deck");
  const toDraw = Math.min(5 - hand.length, deck.length);
  deck.slice(0, toDraw).forEach((card) => moveCardToZone(state, card, "power-hand"));
}

export function isMulliganPending(state: GameState, team: TeamId): boolean {
  return (
    cardsInZone(state, team, "objective-temp-discard").length > 0 ||
    cardsInZone(state, team, "power-temp-discard").length > 0
  );
}

export function canStartMulligan(state: GameState, team: TeamId): boolean {
  if (!canMulliganWindow(state)) return false;
  if (state.winner) return false;
  const t = state.teams[team];
  return !t.mulliganUsed && !isMulliganPending(state, team);
}

export function startMulligan(state: GameState, team: TeamId, options: { objective: boolean; power: boolean }): void {
  if (!canStartMulligan(state, team)) return;
  if (!options.objective && !options.power) return;

  if (options.objective) {
    cardsInZone(state, team, "objective-hand").forEach((card) =>
      moveCardToZone(state, card, "objective-temp-discard"),
    );
  }

  if (options.power) {
    cardsInZone(state, team, "power-hand").forEach((card) =>
      moveCardToZone(state, card, "power-temp-discard"),
    );
  }
}

export function resolveMulligan(state: GameState, team: TeamId): void {
  if (!isMulliganPending(state, team)) return;

  drawObjectivesToThree(state, team);
  drawPowerToFive(state, team);

  const objectiveDeck = cardsInZone(state, team, "objective-deck");
  const objectiveTemp = cardsInZone(state, team, "objective-temp-discard");
  if (objectiveTemp.length > 0) {
    const shuffled = shuffleCards([...objectiveDeck, ...objectiveTemp], state.rngState);
    state.rngState = shuffled.seed;
    shuffled.result.forEach((card) => moveCardToZone(state, card, "objective-deck"));
  }

  const powerDeck = cardsInZone(state, team, "power-deck");
  const powerTemp = cardsInZone(state, team, "power-temp-discard");
  if (powerTemp.length > 0) {
    const shuffled = shuffleCards([...powerDeck, ...powerTemp], state.rngState);
    state.rngState = shuffled.seed;
    shuffled.result.forEach((card) => moveCardToZone(state, card, "power-deck"));
  }

  state.teams[team].mulliganUsed = true;
}
