import { fighterName, fighterPos, fighterStatus, objectiveOccupancy, occupiedBy } from "./state";
import { getLegalActions } from "./systems/legalActions";
import { resolveAttack } from "./systems/combat";
import { resolvePowerCard } from "./systems/cards";
import { resolveMulligan, startMulligan } from "./systems/mulligan";
import { advanceAfterPower, rotatePowerPriority, startPowerStep } from "./systems/turn";
import type { GameAction, GameState, LegalAction } from "./types";

function sameHex(a?: { q: number; r: number }, b?: { q: number; r: number }): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.q === b.q && a.r === b.r;
}

function actionsEqual(a: GameAction, b: GameAction): boolean {
  if (a.type !== b.type) return false;
  if (a.actorTeam !== b.actorTeam) return false;

  switch (a.type) {
    case "move":
      return b.type === "move" && a.fighterId === b.fighterId && sameHex(a.to, b.to);
    case "guard":
      return b.type === "guard" && a.fighterId === b.fighterId;
    case "attack":
      return b.type === "attack" && a.attackerId === b.attackerId && a.targetId === b.targetId;
    case "charge":
      return (
        b.type === "charge" &&
        a.fighterId === b.fighterId &&
        a.targetId === b.targetId &&
        sameHex(a.to, b.to)
      );
    case "play-power":
      return (
        b.type === "play-power" &&
        a.cardId === b.cardId &&
        a.fighterId === b.fighterId &&
        sameHex(a.targetHex, b.targetHex)
      );
    case "pass":
      return b.type === "pass";
    case "end-power":
      return b.type === "end-power";
    case "start-mulligan":
      return b.type === "start-mulligan";
    case "resolve-mulligan":
      return b.type === "resolve-mulligan";
    default:
      return false;
  }
}

function isActionLegal(state: GameState, action: GameAction): boolean {
  const legal = getLegalActions(state, action.actorTeam).map((l) => l.action);
  return legal.some((la) => actionsEqual(la, action));
}

function applyActionStep(state: GameState, action: GameAction): void {
  if (action.type === "start-mulligan") {
    startMulligan(state, action.actorTeam);
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} starts mulligan` });
    return;
  }

  if (action.type === "resolve-mulligan") {
    resolveMulligan(state, action.actorTeam);
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} finalizes mulligan` });
    return;
  }

  if (action.type === "move") {
    fighterPos(state, action.fighterId).q = action.to.q;
    fighterPos(state, action.fighterId).r = action.to.r;
    fighterStatus(state, action.fighterId).guard = false;
    state.log.push({ turn: state.turnInRound, text: `${fighterName(state, action.fighterId)} moves` });
  }

  if (action.type === "guard") {
    fighterStatus(state, action.fighterId).guard = true;
    state.log.push({ turn: state.turnInRound, text: `${fighterName(state, action.fighterId)} guards` });
  }

  if (action.type === "attack") {
    resolveAttack(state, action.attackerId, action.targetId);
  }

  if (action.type === "charge") {
    fighterPos(state, action.fighterId).q = action.to.q;
    fighterPos(state, action.fighterId).r = action.to.r;
    fighterStatus(state, action.fighterId).charged = true;
    fighterStatus(state, action.fighterId).guard = false;
    resolveAttack(state, action.fighterId, action.targetId);
  }

  if (action.type === "pass") {
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} passes action` });
  }

  state.occupiedObjectives = objectiveOccupancy(state);
  startPowerStep(state, action.actorTeam);
}

function applyPowerStep(state: GameState, action: GameAction): void {
  if (action.type === "play-power") {
    resolvePowerCard(state, action);
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} plays a power card` });
    state.powerPassCount = 0;
    rotatePowerPriority(state);
    return;
  }

  if (action.type === "end-power" || action.type === "pass") {
    state.powerPassCount += 1;
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} passes power` });

    if (state.powerPassCount >= 2) {
      advanceAfterPower(state);
      return;
    }

    rotatePowerPriority(state);
  }
}

export function applyAction(state: GameState, action: GameAction): GameState {
  const next = structuredClone(state) as GameState;

  if (next.winner) return next;
  if (action.actorTeam !== next.activeTeam) return next;

  if (!isActionLegal(next, action)) {
    next.log.push({ turn: next.turnInRound, text: `Rejected illegal action: ${action.type}` });
    return next;
  }

  if (next.turnStep === "action") {
    applyActionStep(next, action);
  } else {
    applyPowerStep(next, action);
  }

  return next;
}

export function getFighterAt(state: GameState, q: number, r: number) {
  const id = occupiedBy(state, q, r);
  return id;
}

export function getLegal(state: GameState): LegalAction[] {
  return getLegalActions(state, state.activeTeam);
}
