import { hexKey } from "../hex";
import { objectiveOccupancy } from "../state";
import type { GameState, ObjectiveCard, TeamId } from "../types";

function oppositeTeam(team: TeamId): TeamId {
  return team === "red" ? "blue" : "red";
}

function actionTeamForTurn(firstTeam: TeamId, turnInRound: number): TeamId {
  return turnInRound % 2 === 1 ? firstTeam : oppositeTeam(firstTeam);
}

function drawTo<T>(deck: T[], hand: T[], target: number): void {
  while (hand.length < target && deck.length > 0) {
    const next = deck.shift();
    if (next) hand.push(next);
  }
}

function scoreObjective(state: GameState, team: TeamId, card: ObjectiveCard): boolean {
  if (card.type === "hold-center") {
    const centerKey = hexKey({ q: 0, r: 0 });
    const holder = state.occupiedObjectives[centerKey];
    if (!holder) return false;
    return state.components.fighters[holder].team === team;
  }

  if (card.type === "take-down") {
    return state.teams[team].roundTakedowns > 0;
  }

  if (card.type === "no-mercy") {
    return state.teams[team].roundSuccessfulAttacks >= 2;
  }

  return false;
}

function scoreEndPhase(state: GameState, team: TeamId): void {
  const hand = state.teams[team].objectiveHand;
  const keep: ObjectiveCard[] = [];
  hand.forEach((card) => {
    if (scoreObjective(state, team, card)) {
      state.teams[team].glory += card.glory;
      state.teams[team].scoredObjectives.push(card);
      state.log.push({ turn: state.turnInRound, text: `${team} scores ${card.name} (+${card.glory} glory)` });
    } else {
      keep.push(card);
    }
  });
  state.teams[team].objectiveHand = keep;
}

function finalizeWinner(state: GameState): void {
  const red = state.teams.red.glory;
  const blue = state.teams.blue.glory;
  if (red > blue) {
    state.winner = "red";
  } else if (blue > red) {
    state.winner = "blue";
  } else {
    const hpRed = state.teams.red.fighters
      .map((id) => state.components.fighters[id].hp)
      .reduce((a, b) => a + Math.max(0, b), 0);
    const hpBlue = state.teams.blue.fighters
      .map((id) => state.components.fighters[id].hp)
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

  drawTo(state.teams.red.objectiveDeck, state.teams.red.objectiveHand, 3);
  drawTo(state.teams.blue.objectiveDeck, state.teams.blue.objectiveHand, 3);
  drawTo(state.teams.red.powerDeck, state.teams.red.powerHand, 5);
  drawTo(state.teams.blue.powerDeck, state.teams.blue.powerHand, 5);

  state.teams.red.roundSuccessfulAttacks = 0;
  state.teams.red.roundTakedowns = 0;
  state.teams.blue.roundSuccessfulAttacks = 0;
  state.teams.blue.roundTakedowns = 0;

  Object.values(state.components.fighters).forEach((f) => {
    f.guard = false;
    f.charged = false;
    f.nextAttackBonusDamage = 0;
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
  const bonus = state.teams[secondTeam].powerDeck.shift();
  if (bonus) state.teams[secondTeam].powerHand.push(bonus);
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
