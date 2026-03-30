import { PowerCard, type Fighter } from "../model";
import { boardCoordLabel } from "../coords";
import { hexDistance } from "../hex";
import {
  cardsInZone,
  fightersForTeam,
  fighterName,
  fighterPos,
  fighterWeapon,
  hasStatus,
  fighterTeam,
  isAlive,
  occupiedBy,
} from "../state";
import { canStartMulligan, isMulliganPending } from "./mulligan";
import type { GameState, Hex, LegalAction, TeamId } from "../types";

function aliveTeamFighters(state: GameState, team: TeamId): Fighter[] {
  return fightersForTeam(state, team).filter((fighter) => isAlive(state, fighter));
}

function enemiesInRange(state: GameState, fighter: Fighter, from = fighterPos(state, fighter)): Fighter[] {
  const attackRange = fighterWeapon(state, fighter).attackRange;
  return fightersForTeam(state).filter((other) => {
    if (other === fighter) return false;
    if (!isAlive(state, other)) return false;
    if (fighterTeam(state, other) === fighterTeam(state, fighter)) return false;
    return hexDistance(from, fighterPos(state, other)) <= attackRange;
  });
}

function allFriendlyCharged(state: GameState, team: TeamId): boolean {
  const alive = aliveTeamFighters(state, team);
  return alive.length > 0 && alive.every((fighter) => hasStatus(state, fighter, "charged"));
}

function legalMoves(state: GameState, fighter: Fighter): Hex[] {
  const from = fighterPos(state, fighter);
  const move = fighterWeapon(state, fighter).move;
  return state.boardHexes
    .filter((h) => occupiedBy(state, h.q, h.r) === null)
    .filter((h) => hexDistance(from, h) > 0)
    .filter((h) => hexDistance(from, h) <= move);
}

export function getLegalActions(state: GameState, team: TeamId): LegalAction[] {
  if (state.winner || state.activeTeam !== team) return [];

  const out: LegalAction[] = [];
  const fighters = aliveTeamFighters(state, team);

  if (state.turnStep === "action") {
    const mulliganPending = isMulliganPending(state, team);
    if (mulliganPending) {
      return [{ label: "Finalize mulligan", action: { type: "resolve-mulligan", actorTeam: team } }];
    }

    if (canStartMulligan(state, team)) {
      out.push({
        label: "Redraw objective hand",
        action: { type: "start-mulligan", actorTeam: team, objective: true, power: false },
      });
      out.push({
        label: "Redraw power hand",
        action: { type: "start-mulligan", actorTeam: team, objective: false, power: true },
      });
      out.push({
        label: "Redraw both hands",
        action: { type: "start-mulligan", actorTeam: team, objective: true, power: true },
      });
    }

    const canBreakChargeLock = allFriendlyCharged(state, team);
    fighters.forEach((fighter) => {
      const chargeLocked = hasStatus(state, fighter, "charged") && !canBreakChargeLock;

      if (!chargeLocked) {
        legalMoves(state, fighter).forEach((to) => {
          out.push({
            label: `Move ${fighterName(state, fighter)} -> ${boardCoordLabel(to)}`,
            action: { type: "move", actorTeam: team, fighter, to },
          });
        });

        enemiesInRange(state, fighter).forEach((target) => {
          out.push({
            label: `Attack ${fighterName(state, fighter)} -> ${fighterName(state, target)}`,
            action: { type: "attack", actorTeam: team, attacker: fighter, target },
          });
        });

        if (!hasStatus(state, fighter, "charged")) {
          legalMoves(state, fighter).forEach((to) => {
            enemiesInRange(state, fighter, to).forEach((target) => {
              out.push({
                label: `Charge ${fighterName(state, fighter)} -> ${boardCoordLabel(to)} then ${fighterName(state, target)}`,
                action: { type: "charge", actorTeam: team, fighter, to, target },
              });
            });
          });
        }

        out.push({
          label: `Guard ${fighterName(state, fighter)}`,
          action: { type: "guard", actorTeam: team, fighter },
        });
      }
    });

    out.push({ label: "Pass action", action: { type: "pass", actorTeam: team } });
    return out;
  }

  const hand = cardsInZone(state, team, "power-hand");
  hand.forEach((card) => {
    if (!(card instanceof PowerCard)) return;
    card.legalActions(state, team).forEach((action) => {
      out.push({ label: card.describeAction(state, action), action });
    });
  });

  out.push({ label: "Pass power", action: { type: "pass", actorTeam: team } });
  return out;
}

