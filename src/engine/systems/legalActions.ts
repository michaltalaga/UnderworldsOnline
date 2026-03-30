import { boardCoordLabel } from "../coords";
import { hexDistance, neighbors } from "../hex";
import {
  cardEntityIdsInZone,
  cardName,
  cardPowerType,
  fighterCombat,
  fighterEntityIds,
  fighterHealth,
  fighterName,
  fighterPos,
  fighterStatus,
  fighterTeam,
  isAlive,
  occupiedBy,
} from "../state";
import { canStartMulligan, isMulliganPending } from "./mulligan";
import type { EntityId, GameAction, GameState, Hex, LegalAction, TeamId } from "../types";

function aliveTeamFighters(state: GameState, team: TeamId): EntityId[] {
  return fighterEntityIds(state, team).filter((id) => isAlive(state, id));
}

function enemiesInRange(state: GameState, fighterId: EntityId, from = fighterPos(state, fighterId)): EntityId[] {
  const attackRange = fighterCombat(state, fighterId).attackRange;
  return fighterEntityIds(state).filter((otherId) => {
    if (otherId === fighterId) return false;
    if (!isAlive(state, otherId)) return false;
    if (fighterTeam(state, otherId) === fighterTeam(state, fighterId)) return false;
    return hexDistance(from, fighterPos(state, otherId)) <= attackRange;
  });
}

function allFriendlyCharged(state: GameState, team: TeamId): boolean {
  const alive = aliveTeamFighters(state, team);
  return alive.length > 0 && alive.every((id) => fighterStatus(state, id).charged);
}

function legalMoves(state: GameState, fighterId: EntityId): Hex[] {
  const from = fighterPos(state, fighterId);
  const move = fighterCombat(state, fighterId).move;
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
      out.push({ label: "Mulligan hand", action: { type: "start-mulligan", actorTeam: team } });
    }

    const canBreakChargeLock = allFriendlyCharged(state, team);
    fighters.forEach((fighterId) => {
      const status = fighterStatus(state, fighterId);
      const chargeLocked = status.charged && !canBreakChargeLock;

      if (!chargeLocked) {
        legalMoves(state, fighterId).forEach((to) => {
          out.push({
            label: `Move ${fighterName(state, fighterId)} -> ${boardCoordLabel(to)}`,
            action: { type: "move", actorTeam: team, fighterId, to },
          });
        });

        enemiesInRange(state, fighterId).forEach((targetId) => {
          out.push({
            label: `Attack ${fighterName(state, fighterId)} -> ${fighterName(state, targetId)}`,
            action: { type: "attack", actorTeam: team, attackerId: fighterId, targetId },
          });
        });

        if (!status.charged) {
          legalMoves(state, fighterId).forEach((to) => {
            enemiesInRange(state, fighterId, to).forEach((targetId) => {
              out.push({
                label: `Charge ${fighterName(state, fighterId)} -> ${boardCoordLabel(to)} then ${fighterName(state, targetId)}`,
                action: { type: "charge", actorTeam: team, fighterId, to, targetId },
              });
            });
          });
        }

        out.push({
          label: `Guard ${fighterName(state, fighterId)}`,
          action: { type: "guard", actorTeam: team, fighterId },
        });
      }
    });

    out.push({ label: "Pass action", action: { type: "pass", actorTeam: team } });
    return out;
  }

  const hand = cardEntityIdsInZone(state, team, "power-hand");
  hand.forEach((cardId) => {
    const powerType = cardPowerType(state, cardId);
    if (!powerType) return;
    const name = cardName(state, cardId);

    if (powerType === "ferocious-strike") {
      fighters.forEach((fighterId) => {
        out.push({
          label: `Play ${name} on ${fighterName(state, fighterId)}`,
          action: { type: "play-power", actorTeam: team, cardId, fighterId },
        });
      });
    }

    if (powerType === "healing-potion") {
      fighters
        .filter((fighterId) => fighterHealth(state, fighterId).hp < fighterHealth(state, fighterId).maxHp)
        .forEach((fighterId) => {
          out.push({
            label: `Play ${name} on ${fighterName(state, fighterId)}`,
            action: { type: "play-power", actorTeam: team, cardId, fighterId },
          });
        });
    }

    if (powerType === "sidestep") {
      fighters.forEach((fighterId) => {
        neighbors(fighterPos(state, fighterId))
          .filter((h) => occupiedBy(state, h.q, h.r) === null)
          .forEach((targetHex) => {
            out.push({
              label: `Play ${name}: ${fighterName(state, fighterId)} -> ${boardCoordLabel(targetHex)}`,
              action: { type: "play-power", actorTeam: team, cardId, fighterId, targetHex },
            });
          });
      });
    }
  });

  out.push({ label: "Pass power", action: { type: "pass", actorTeam: team } });
  return out;
}

export function actionSignature(action: GameAction): string {
  return JSON.stringify(action);
}
