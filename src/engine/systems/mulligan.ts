import { nextRng } from "../rng";
import { cardEntityIdsInZone, moveCardEntityToZone } from "../state";
import type { EntityId, GameState, TeamId } from "../types";

function canMulliganWindow(state: GameState): boolean {
  return state.round === 1 && state.turnInRound === 1;
}

function shuffleEntityIds(ids: EntityId[], seed: number): { seed: number; result: EntityId[] } {
  const out = [...ids];
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
  const hand = cardEntityIdsInZone(state, team, "objective-hand");
  if (hand.length >= 3) return;
  const deck = cardEntityIdsInZone(state, team, "objective-deck");
  const toDraw = Math.min(3 - hand.length, deck.length);
  deck.slice(0, toDraw).forEach((cardId) => moveCardEntityToZone(state, cardId, "objective-hand"));
}

function drawPowerToFive(state: GameState, team: TeamId): void {
  const hand = cardEntityIdsInZone(state, team, "power-hand");
  if (hand.length >= 5) return;
  const deck = cardEntityIdsInZone(state, team, "power-deck");
  const toDraw = Math.min(5 - hand.length, deck.length);
  deck.slice(0, toDraw).forEach((cardId) => moveCardEntityToZone(state, cardId, "power-hand"));
}

export function isMulliganPending(state: GameState, team: TeamId): boolean {
  return (
    cardEntityIdsInZone(state, team, "objective-temp-discard").length > 0 ||
    cardEntityIdsInZone(state, team, "power-temp-discard").length > 0
  );
}

export function canStartMulligan(state: GameState, team: TeamId): boolean {
  if (!canMulliganWindow(state)) return false;
  if (state.winner) return false;
  const t = state.teams[team];
  return !t.mulliganUsed && !isMulliganPending(state, team);
}

export function startMulligan(state: GameState, team: TeamId): void {
  if (!canStartMulligan(state, team)) return;

  cardEntityIdsInZone(state, team, "objective-hand").forEach((cardId) =>
    moveCardEntityToZone(state, cardId, "objective-temp-discard"),
  );
  cardEntityIdsInZone(state, team, "power-hand").forEach((cardId) =>
    moveCardEntityToZone(state, cardId, "power-temp-discard"),
  );

  drawObjectivesToThree(state, team);
  drawPowerToFive(state, team);
}

export function resolveMulligan(state: GameState, team: TeamId): void {
  if (!isMulliganPending(state, team)) return;

  const objectiveDeck = cardEntityIdsInZone(state, team, "objective-deck");
  const objectiveTemp = cardEntityIdsInZone(state, team, "objective-temp-discard");
  if (objectiveTemp.length > 0) {
    const shuffled = shuffleEntityIds([...objectiveDeck, ...objectiveTemp], state.rngState);
    state.rngState = shuffled.seed;
    shuffled.result.forEach((cardId) => moveCardEntityToZone(state, cardId, "objective-deck"));
  }

  const powerDeck = cardEntityIdsInZone(state, team, "power-deck");
  const powerTemp = cardEntityIdsInZone(state, team, "power-temp-discard");
  if (powerTemp.length > 0) {
    const shuffled = shuffleEntityIds([...powerDeck, ...powerTemp], state.rngState);
    state.rngState = shuffled.seed;
    shuffled.result.forEach((cardId) => moveCardEntityToZone(state, cardId, "power-deck"));
  }

  state.teams[team].mulliganUsed = true;
}
