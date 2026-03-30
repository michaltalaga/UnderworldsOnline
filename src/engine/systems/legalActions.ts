import { hexDistance, neighbors } from "../hex";
import { boardCoordLabel } from "../coords";
import { isAlive, occupiedBy } from "../state";
import type { FighterEntity, GameAction, GameState, LegalAction, TeamId } from "../types";

function aliveTeamFighters(state: GameState, team: TeamId): FighterEntity[] {
  return state.teams[team].fighters
    .map((id) => state.components.fighters[id])
    .filter((f) => isAlive(f));
}

function enemiesInRange(state: GameState, fighter: FighterEntity, from = fighter.pos): FighterEntity[] {
  return Object.values(state.components.fighters).filter(
    (other) =>
      isAlive(other) &&
      other.team !== fighter.team &&
      hexDistance(from, other.pos) <= fighter.stats.attackRange,
  );
}

function allFriendlyCharged(state: GameState, team: TeamId): boolean {
  const alive = aliveTeamFighters(state, team);
  return alive.length > 0 && alive.every((f) => f.charged);
}

function legalMoves(state: GameState, fighter: FighterEntity) {
  return state.boardHexes
    .filter((h) => occupiedBy(state, h.q, h.r) === null)
    .filter((h) => hexDistance(fighter.pos, h) > 0)
    .filter((h) => hexDistance(fighter.pos, h) <= fighter.stats.move);
}

export function getLegalActions(state: GameState, team: TeamId): LegalAction[] {
  if (state.winner || state.activeTeam !== team) return [];

  const out: LegalAction[] = [];
  const fighters = aliveTeamFighters(state, team);

  if (state.turnStep === "action") {
    const canBreakChargeLock = allFriendlyCharged(state, team);
    fighters.forEach((f) => {
      const chargeLocked = f.charged && !canBreakChargeLock;

      if (!chargeLocked) {
        legalMoves(state, f).forEach((to) => {
          out.push({
            label: `Move ${f.name} -> ${boardCoordLabel(to)}`,
            action: { type: "move", actorTeam: team, fighterId: f.id, to },
          });
        });

        enemiesInRange(state, f).forEach((t) => {
          out.push({
            label: `Attack ${f.name} -> ${t.name}`,
            action: { type: "attack", actorTeam: team, attackerId: f.id, targetId: t.id },
          });
        });

        if (!f.charged) {
          legalMoves(state, f).forEach((to) => {
            enemiesInRange(state, f, to).forEach((t) => {
              out.push({
                label: `Charge ${f.name} -> ${boardCoordLabel(to)} then ${t.name}`,
                action: { type: "charge", actorTeam: team, fighterId: f.id, to, targetId: t.id },
              });
            });
          });
        }

        out.push({
          label: `Guard ${f.name}`,
          action: { type: "guard", actorTeam: team, fighterId: f.id },
        });
      }
    });

    out.push({ label: "Pass action", action: { type: "pass", actorTeam: team } });
    return out;
  }

  const hand = state.teams[team].powerHand;
  hand.forEach((card) => {
    if (card.type === "ferocious-strike") {
      fighters.forEach((f) => {
        out.push({
          label: `Play ${card.name} on ${f.name}`,
          action: { type: "play-power", actorTeam: team, cardId: card.id, fighterId: f.id },
        });
      });
    }

    if (card.type === "healing-potion") {
      fighters
        .filter((f) => f.hp < f.stats.maxHp)
        .forEach((f) => {
          out.push({
            label: `Play ${card.name} on ${f.name}`,
            action: { type: "play-power", actorTeam: team, cardId: card.id, fighterId: f.id },
          });
        });
    }

    if (card.type === "sidestep") {
      fighters.forEach((f) => {
        neighbors(f.pos)
          .filter((h) => occupiedBy(state, h.q, h.r) === null)
          .forEach((targetHex) => {
            out.push({
              label: `Play ${card.name}: ${f.name} -> ${boardCoordLabel(targetHex)}`,
              action: { type: "play-power", actorTeam: team, cardId: card.id, fighterId: f.id, targetHex },
            });
          });
      });
    }
  });

  out.push({
    label: "Pass power",
    action: { type: "pass", actorTeam: team },
  });

  return out;
}

export function actionSignature(action: GameAction): string {
  return JSON.stringify(action);
}
