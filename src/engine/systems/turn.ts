import { hexKey } from "../hex";
import {
  cardGloryValue,
  cardEntityIdsInZone,
  cardName,
  cardObjectiveType,
  fighterCombat,
  fighterEntityIds,
  fighterHealth,
  fighterStatus,
  fighterTeam,
  moveCardEntityToZone,
  objectiveOccupancy,
} from "../state";
import type { EntityId, GameState, TeamId } from "../types";

function oppositeTeam(team: TeamId): TeamId {
  return team === "red" ? "blue" : "red";
}

function actionTeamForTurn(firstTeam: TeamId, turnInRound: number): TeamId {
  return turnInRound % 2 === 1 ? firstTeam : oppositeTeam(firstTeam);
}

function drawObjectivesToThree(state: GameState, team: TeamId): void {
  const hand = cardEntityIdsInZone(state, team, "objective-hand");
  const deck = cardEntityIdsInZone(state, team, "objective-deck");
  const drawCount = Math.max(0, Math.min(3 - hand.length, deck.length));
  deck.slice(0, drawCount).forEach((cardId) => moveCardEntityToZone(state, cardId, "objective-hand"));
}

function drawPowerToFive(state: GameState, team: TeamId): void {
  const hand = cardEntityIdsInZone(state, team, "power-hand");
  const deck = cardEntityIdsInZone(state, team, "power-deck");
  const drawCount = Math.max(0, Math.min(5 - hand.length, deck.length));
  deck.slice(0, drawCount).forEach((cardId) => moveCardEntityToZone(state, cardId, "power-hand"));
}

function scoreObjective(state: GameState, team: TeamId, cardId: EntityId): boolean {
  const objectiveType = cardObjectiveType(state, cardId);
  if (!objectiveType) return false;

  if (objectiveType === "hold-center") {
    const centerKey = hexKey({ q: 0, r: 0 });
    const holder = state.occupiedObjectives[centerKey];
    if (!holder) return false;
    return fighterTeam(state, holder) === team;
  }

  if (objectiveType === "take-down") {
    return state.teams[team].roundTakedowns > 0;
  }

  if (objectiveType === "no-mercy") {
    return state.teams[team].roundSuccessfulAttacks >= 2;
  }

  return false;
}

function scoreEndPhase(state: GameState, team: TeamId): void {
  const hand = cardEntityIdsInZone(state, team, "objective-hand");
  hand.forEach((cardId) => {
    if (scoreObjective(state, team, cardId)) {
      const glory = cardGloryValue(state, cardId);
      state.teams[team].glory += glory;
      moveCardEntityToZone(state, cardId, "objective-scored");
      state.log.push({ turn: state.turnInRound, text: `${team} scores ${cardName(state, cardId)} (+${glory} glory)` });
    }
  });
}

function finalizeWinner(state: GameState): void {
  const red = state.teams.red.glory;
  const blue = state.teams.blue.glory;
  if (red > blue) {
    state.winner = "red";
  } else if (blue > red) {
    state.winner = "blue";
  } else {
    const hpRed = state.teams.red.fighterEntities
      .map((id) => fighterHealth(state, id).hp)
      .reduce((a, b) => a + Math.max(0, b), 0);
    const hpBlue = state.teams.blue.fighterEntities
      .map((id) => fighterHealth(state, id).hp)
      .reduce((a, b) => a + Math.max(0, b), 0);
    if (hpRed > hpBlue) state.winner = "red";
    else if (hpBlue > hpRed) state.winner = "blue";
    else state.winner = "draw";
  }
}

function endRound(state: GameState): void {
  state.occupiedObjectives = objectiveOccupancy(state);
  scoreEndPhase(state, "red");
  scoreEndPhase(state, "blue");

  drawObjectivesToThree(state, "red");
  drawObjectivesToThree(state, "blue");
  drawPowerToFive(state, "red");
  drawPowerToFive(state, "blue");

  state.teams.red.roundSuccessfulAttacks = 0;
  state.teams.red.roundTakedowns = 0;
  state.teams.blue.roundSuccessfulAttacks = 0;
  state.teams.blue.roundTakedowns = 0;

  fighterEntityIds(state).forEach((id) => {
    fighterStatus(state, id).guard = false;
    fighterStatus(state, id).charged = false;
    fighterCombat(state, id).nextAttackBonusDamage = 0;
  });

  if (state.round >= 3) {
    finalizeWinner(state);
    state.log.push({ turn: state.turnInRound, text: `Game ended: ${state.winner}` });
    return;
  }

  state.round += 1;
  state.turnInRound = 1;
  state.firstTeam = oppositeTeam(state.firstTeam);
  state.activeTeam = state.firstTeam;
  state.powerPriorityTeam = state.firstTeam;
  state.powerPassCount = 0;
  state.turnStep = "action";

  const secondTeam: TeamId = oppositeTeam(state.firstTeam);
  const bonus = cardEntityIdsInZone(state, secondTeam, "power-deck")[0];
  if (bonus) moveCardEntityToZone(state, bonus, "power-hand");
}

export function advanceAfterPower(state: GameState): void {
  state.turnInRound += 1;
  state.activeTeam = actionTeamForTurn(state.firstTeam, state.turnInRound);
  state.powerPriorityTeam = state.activeTeam;
  state.powerPassCount = 0;
  state.turnStep = "action";

  if (state.turnInRound > 8) {
    endRound(state);
  }
}

export function startPowerStep(state: GameState, actionTeam: TeamId): void {
  state.turnStep = "power";
  state.powerPriorityTeam = actionTeam;
  state.activeTeam = actionTeam;
  state.powerPassCount = 0;
}

export function rotatePowerPriority(state: GameState): void {
  state.powerPriorityTeam = oppositeTeam(state.powerPriorityTeam);
  state.activeTeam = state.powerPriorityTeam;
}
