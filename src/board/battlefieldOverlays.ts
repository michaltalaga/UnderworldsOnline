import {
  CardKind,
  PlayPloyAction,
  PlayUpgradeAction,
  TurnStep,
  UseWarscrollAbilityAction,
  type CardId,
  type FeatureToken,
  type FighterId,
  type Game,
  type GameAction,
  type HexId,
  type Player,
} from "../domain";
import { Fighter } from "../domain/state/Fighter";
import { compactHexId, getFeatureTokenBadge, getFighterName } from "./battlefieldFormatters";
import type {
  BoardTurnHeaderModel,
  PowerOverlayModel,
  PowerOverlayOption,
} from "./battlefieldModels";

// Builders for the view models the board + dock render:
// * `power`  — ploys/upgrades for the dock + warscroll abilities for the board
// * `boardTurnHeader` — top-of-map banner describing the current armed intent
//
// Both are pure projections of game state + UI intent, kept together here
// so they can evolve without touching the main battlefield component.
// Focus card rendering lives in PlayerHandDock — it reads
// `player.objectiveHand` / `player.powerHand` directly, so there is no
// focus overlay model.

export function getPowerOverlayModel(
  game: Game,
  activePlayer: Player | null,
  legalActions: GameAction[],
): PowerOverlayModel {
  if (activePlayer === null || game.turnStep !== TurnStep.Power) {
    return {
      ploys: [],
      upgrades: [],
      warscrollAbilities: [],
      hasAnyOptions: false,
    };
  }

  const ployOptions = new Map<string, PowerOverlayOption>();
  for (const card of activePlayer.powerHand) {
    if (card.kind !== CardKind.Ploy) {
      continue;
    }

    const targets = card.getLegalTargets(game);
    if (targets.length === 0) {
      continue;
    }

    for (const target of targets) {
      const targetFighterId = target instanceof Fighter ? target.id : null;
      const action = new PlayPloyAction(activePlayer.id, card.id, targetFighterId);
      const key = `ploy:${action.cardId}:${action.targetFighterId ?? "none"}`;
      if (ployOptions.has(key)) {
        continue;
      }

      ployOptions.set(key, {
        key,
        title: card.name,
        detail:
          targetFighterId === null
            ? card.text || "Play this ploy."
            : `Target ${getFighterName(game, targetFighterId)}`,
        action,
      });
    }
  }
  const ploys = [...ployOptions.values()];

  const upgrades: PowerOverlayOption[] = [];
  for (const card of activePlayer.powerHand) {
    if (card.kind !== CardKind.Upgrade) {
      continue;
    }

    const targets = card.getLegalTargets(game);
    for (const target of targets) {
      if (!(target instanceof Fighter)) {
        continue;
      }

      const action = new PlayUpgradeAction(activePlayer.id, card.id, target.id);
      upgrades.push({
        key: `upgrade:${action.cardId}:${action.fighterId}`,
        title: card.name,
        detail: `Attach to ${getFighterName(game, target.id)} • ${card.gloryValue} glory`,
        action,
      });
    }
  }

  const warscrollAbilities = legalActions.flatMap((action) => {
    if (!(action instanceof UseWarscrollAbilityAction)) {
      return [];
    }

    const ability = activePlayer.getWarscrollDefinition()?.getAbility(action.abilityIndex);
    if (ability === undefined) {
      return [];
    }

    return [{
      key: `warscroll:${action.abilityIndex}`,
      title: ability.name,
      detail: ability.text,
      action,
    }];
  });

  return {
    ploys,
    upgrades,
    warscrollAbilities,
    hasAnyOptions: ploys.length > 0 || upgrades.length > 0 || warscrollAbilities.length > 0,
  };
}

export function getPowerOverlayOptionByKey(
  powerOverlay: PowerOverlayModel,
  key: string,
): PowerOverlayOption | null {
  return [
    ...powerOverlay.warscrollAbilities,
    ...powerOverlay.ploys,
    ...powerOverlay.upgrades,
  ].find((option) => option.key === key) ?? null;
}

// Groups all hand-playable options (ploys + upgrades) by their source card id.
// Warscroll abilities are intentionally excluded — they stay in the board's
// power overlay because they are not cards.
//
// A single card can produce multiple options when it has multiple valid
// targets (e.g., a ploy that can target any of three fighters). The dock
// uses this map to render playable cards and, when more than one option is
// grouped under a card, to drive an inline target picker.
export function buildHandPowerPlayableMap(
  model: PowerOverlayModel,
): Map<CardId, PowerOverlayOption[]> {
  const byCardId = new Map<CardId, PowerOverlayOption[]>();
  for (const option of [...model.ploys, ...model.upgrades]) {
    const cardId = getCardIdFromPowerOption(option);
    if (cardId === null) {
      continue;
    }
    const existing = byCardId.get(cardId);
    if (existing === undefined) {
      byCardId.set(cardId, [option]);
    } else {
      existing.push(option);
    }
  }
  return byCardId;
}

// Unwraps a PowerOverlayOption to its source card id, when the underlying
// action is a card play. Returns null for warscroll abilities (which have
// no card id). Used by the battlefield parent to sync the dock's armed
// card with the engine's armed power option.
export function getCardIdFromPowerOption(option: PowerOverlayOption): CardId | null {
  if (option.action instanceof PlayPloyAction) {
    return option.action.cardId;
  }
  if (option.action instanceof PlayUpgradeAction) {
    return option.action.cardId;
  }
  return null;
}

export function getBoardTurnHeaderModel({
  activePlayerName,
  game,
  pendingAttackBadgeLabel,
  pendingAttackTargetName,
  pendingChargeBadgeLabel,
  pendingChargeHexId,
  pendingChargeTargetName,
  pendingDelveFeatureTokenId,
  pendingFocus,
  pendingGuardFighterId,
  pendingMoveHexId,
  pendingPassPower,
  pendingPowerOption,
  selectedFighterName,
  selectedFeatureToken,
}: {
  activePlayerName: string;
  game: Game;
  pendingAttackBadgeLabel: string | null;
  pendingAttackTargetName: string | null;
  pendingChargeBadgeLabel: string | null;
  pendingChargeHexId: HexId | null;
  pendingChargeTargetName: string | null;
  pendingDelveFeatureTokenId: FeatureToken["id"] | null;
  pendingFocus: boolean;
  pendingGuardFighterId: FighterId | null;
  pendingMoveHexId: HexId | null;
  pendingPassPower: boolean;
  pendingPowerOption: PowerOverlayOption | null;
  selectedFighterName: string;
  selectedFeatureToken: FeatureToken | null;
}): BoardTurnHeaderModel {
  const roundLabel = getRoundLabel(game);
  const scores = game.players.map((p) => ({ name: p.name, glory: p.glory }));
  if (game.turnStep === TurnStep.Action) {
    if (pendingFocus) {
      return {
        activePlayerName,
        interactionLabel: "Focus is armed",
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
        scores,
      };
    }

    if (pendingGuardFighterId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Guard is armed for ${selectedFighterName}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
        scores,
      };
    }

    if (pendingAttackTargetName !== null) {
      return {
        activePlayerName,
        interactionLabel:
          pendingAttackBadgeLabel === null
            ? `Attack ${pendingAttackTargetName}`
            : `Attack ${pendingAttackTargetName} with ${pendingAttackBadgeLabel}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
        scores,
      };
    }

    if (pendingChargeTargetName !== null && pendingChargeHexId !== null) {
      return {
        activePlayerName,
        interactionLabel:
          pendingChargeBadgeLabel === null
            ? `Charge from ${compactHexId(pendingChargeHexId)} into ${pendingChargeTargetName}`
            : `Charge ${pendingChargeTargetName} from ${compactHexId(pendingChargeHexId)} with ${pendingChargeBadgeLabel}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
        scores,
      };
    }

    if (pendingChargeHexId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Charge path armed at ${compactHexId(pendingChargeHexId)}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
        scores,
      };
    }

    if (pendingMoveHexId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Move armed to ${compactHexId(pendingMoveHexId)}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
        scores,
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose focus, move, charge, guard, or attack.",
      isArmed: false,
      stepLabel: "Action Step",
      tone: "action",
      roundLabel,
      scores,
    };
  }

  if (game.turnStep === TurnStep.Power) {
    if (pendingDelveFeatureTokenId !== null && selectedFeatureToken?.id === pendingDelveFeatureTokenId) {
      return {
        activePlayerName,
        interactionLabel: `Delve ${getFeatureTokenBadge(selectedFeatureToken)} is armed`,
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
        roundLabel,
        scores,
      };
    }

    if (pendingPassPower) {
      return {
        activePlayerName,
        interactionLabel: "Pass Power is armed",
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
        roundLabel,
        scores,
      };
    }

    if (pendingPowerOption !== null) {
      return {
        activePlayerName,
        interactionLabel: `${pendingPowerOption.title} is armed`,
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
        roundLabel,
        scores,
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose a power play, delve, or pass.",
      isArmed: false,
      stepLabel: "Power Step",
      tone: "power",
      roundLabel,
      scores,
    };
  }

  return {
    activePlayerName,
    interactionLabel: "Board is waiting for the next step.",
    isArmed: false,
    stepLabel: "Board State",
    tone: "neutral",
    roundLabel,
    scores,
  };
}

// Computes a short label like "Round 1 · Turn 2/4" for the active player's
// current activation within the round. Returns null when the game isn't in
// an interactive combat turn (setup, end phase, finished, combat-ready).
function getRoundLabel(game: Game): string | null {
  if (game.state.kind !== "combatTurn" || game.activePlayerId === null) {
    return null;
  }
  const activePlayer = game.getPlayer(game.activePlayerId);
  if (activePlayer === undefined) {
    return null;
  }
  const activationNumber = activePlayer.turnsTakenThisRound + 1;
  return `Round ${game.roundNumber} · Turn ${activationNumber}/4`;
}
