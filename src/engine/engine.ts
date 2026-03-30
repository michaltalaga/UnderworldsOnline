import { addStatus, cloneState, fighterName, fighterPos, objectiveOccupancy, removeStatus } from "./state";
import { getLegalActions } from "./systems/legalActions";
import { resolveAttack } from "./systems/combat";
import { resolvePowerCard } from "./systems/cards";
import { resolveMulligan, startMulligan } from "./systems/mulligan";
import { advanceAfterPower, rotatePowerPriority, startPowerStep } from "./systems/turn";
import type { GameAction, GameState, LegalAction } from "./types";
import { ObjectiveCard, PowerCard } from "./model";

function sameHex(a?: { q: number; r: number }, b?: { q: number; r: number }): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.q === b.q && a.r === b.r;
}

function sameCard(a: GameAction extends never ? never : import("./model").Card, b: import("./model").Card): boolean {
  if (a.constructor !== b.constructor) return false;
  if (a.owner !== b.owner || a.name !== b.name) return false;
  if (a instanceof ObjectiveCard && b instanceof ObjectiveCard) return a.goal === b.goal && a.glory === b.glory;
  if (a instanceof PowerCard && b instanceof PowerCard) return a.effect === b.effect;
  return true;
}

function actionsEqual(a: GameAction, b: GameAction): boolean {
  if (a.type !== b.type) return false;
  if (a.actorTeam !== b.actorTeam) return false;

  switch (a.type) {
    case "move":
      return b.type === "move" && a.fighter.id === b.fighter.id && sameHex(a.to, b.to);
    case "guard":
      return b.type === "guard" && a.fighter.id === b.fighter.id;
    case "attack":
      return b.type === "attack" && a.attacker.id === b.attacker.id && a.target.id === b.target.id;
    case "charge":
      return (
        b.type === "charge" &&
        a.fighter.id === b.fighter.id &&
        a.target.id === b.target.id &&
        sameHex(a.to, b.to)
      );
    case "play-power":
      return (
        b.type === "play-power" &&
        sameCard(a.card, b.card) &&
        a.fighter?.id === b.fighter?.id &&
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
    startMulligan(state, action.actorTeam, { objective: action.objective, power: action.power });
    const redrawTarget = action.objective && action.power ? "objective and power hands" : action.objective ? "objective hand" : "power hand";
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} sets aside ${redrawTarget} for mulligan` });
    return;
  }

  if (action.type === "resolve-mulligan") {
    resolveMulligan(state, action.actorTeam);
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} draws a replacement hand and shuffles set-aside cards back` });
    return;
  }

  if (action.type === "move") {
    fighterPos(state, action.fighter).q = action.to.q;
    fighterPos(state, action.fighter).r = action.to.r;
    removeStatus(state, action.fighter, "guard");
    state.log.push({ turn: state.turnInRound, text: `${fighterName(state, action.fighter)} moves` });
  }

  if (action.type === "guard") {
    addStatus(state, action.fighter, "guard");
    state.log.push({ turn: state.turnInRound, text: `${fighterName(state, action.fighter)} guards` });
  }

  if (action.type === "attack") {
    resolveAttack(state, action.attacker, action.target);
  }

  if (action.type === "charge") {
    fighterPos(state, action.fighter).q = action.to.q;
    fighterPos(state, action.fighter).r = action.to.r;
    addStatus(state, action.fighter, "charged");
    removeStatus(state, action.fighter, "guard");
    resolveAttack(state, action.fighter, action.target);
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
  const next = cloneState(state);

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

export function getLegal(state: GameState): LegalAction[] {
  return getLegalActions(state, state.activeTeam);
}
