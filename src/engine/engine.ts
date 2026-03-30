import { objectiveOccupancy, occupiedBy } from "./state";
import { getLegalActions, actionSignature } from "./systems/legalActions";
import { resolveAttack } from "./systems/combat";
import { resolvePowerCard } from "./systems/cards";
import { advanceAfterPower } from "./systems/turn";
import type { GameAction, GameState, LegalAction } from "./types";

function isActionLegal(state: GameState, action: GameAction): boolean {
  const legal = getLegalActions(state, action.actorTeam).map((l) => actionSignature(l.action));
  return legal.includes(actionSignature(action));
}

function applyActionStep(state: GameState, action: GameAction): void {
  if (action.type === "move") {
    const fighter = state.components.fighters[action.fighterId];
    fighter.pos = action.to;
    fighter.guard = false;
    state.log.push({ turn: state.turnInRound, text: `${fighter.name} moves` });
  }

  if (action.type === "guard") {
    const fighter = state.components.fighters[action.fighterId];
    fighter.guard = true;
    state.log.push({ turn: state.turnInRound, text: `${fighter.name} guards` });
  }

  if (action.type === "attack") {
    resolveAttack(state, action.attackerId, action.targetId);
  }

  if (action.type === "charge") {
    const fighter = state.components.fighters[action.fighterId];
    fighter.pos = action.to;
    fighter.charged = true;
    fighter.guard = false;
    resolveAttack(state, action.fighterId, action.targetId);
  }

  if (action.type === "pass") {
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} passes action` });
  }

  state.occupiedObjectives = objectiveOccupancy(state);
  state.turnStep = "power";
}

function applyPowerStep(state: GameState, action: GameAction): void {
  if (action.type === "play-power") {
    resolvePowerCard(state, action);
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} plays a power card` });
    advanceAfterPower(state);
    return;
  }

  if (action.type === "end-power" || action.type === "pass") {
    state.log.push({ turn: state.turnInRound, text: `${action.actorTeam} ends power step` });
    advanceAfterPower(state);
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
  return id ? state.components.fighters[id] : null;
}

export function getLegal(state: GameState): LegalAction[] {
  return getLegalActions(state, state.activeTeam);
}
