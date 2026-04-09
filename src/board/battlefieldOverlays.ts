import {
  CardKind,
  PlayPloyAction,
  PlayUpgradeAction,
  TurnStep,
  UseWarscrollAbilityAction,
  type CardId,
  type FeatureTokenState,
  type FighterId,
  type Game,
  type GameAction,
  type HexId,
  type PlayerState,
} from "../domain";
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
  activePlayer: PlayerState | null,
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

  const world = game.getEventLogState();

  const ployOptions = new Map<string, PowerOverlayOption>();
  const candidateTargetFighterIds: Array<FighterId | null> = [
    null,
    ...game.players.flatMap((player) => player.fighters.map((fighter) => fighter.id)),
  ];
  for (const targetFighterId of candidateTargetFighterIds) {
    for (const playableCard of activePlayer.getPlayableCards(
      game,
      world,
      { targetFighterId },
      activePlayer.powerHand,
    )) {
      if (playableCard.definition.kind !== CardKind.Ploy) {
        continue;
      }

      const action = new PlayPloyAction(activePlayer.id, playableCard.card.id, targetFighterId);
      const key = `ploy:${action.cardId}:${action.targetFighterId ?? "none"}`;
      if (ployOptions.has(key)) {
        continue;
      }

      ployOptions.set(key, {
        key,
        title: playableCard.definition.name,
        detail:
          targetFighterId === null
            ? playableCard.definition.text || "Play this ploy."
            : `Target ${getFighterName(game, targetFighterId)}`,
        action,
      });
    }
  }
  const ploys = [...ployOptions.values()];

  const upgrades: PowerOverlayOption[] = [];
  for (const fighter of activePlayer.fighters) {
    for (const playableCard of activePlayer.getPlayableCards(
      game,
      world,
      { equippedFighterId: fighter.id },
      activePlayer.powerHand,
    )) {
      if (playableCard.definition.kind !== CardKind.Upgrade) {
        continue;
      }

      const action = new PlayUpgradeAction(activePlayer.id, playableCard.card.id, fighter.id);
      upgrades.push({
        key: `upgrade:${action.cardId}:${action.fighterId}`,
        title: playableCard.definition.name,
        detail: `Attach to ${getFighterName(game, fighter.id)} • ${playableCard.definition.gloryValue} glory`,
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
  pendingDelveFeatureTokenId: FeatureTokenState["id"] | null;
  pendingFocus: boolean;
  pendingGuardFighterId: FighterId | null;
  pendingMoveHexId: HexId | null;
  pendingPassPower: boolean;
  pendingPowerOption: PowerOverlayOption | null;
  selectedFighterName: string;
  selectedFeatureToken: FeatureTokenState | null;
}): BoardTurnHeaderModel {
  const roundLabel = getRoundLabel(game);
  if (game.turnStep === TurnStep.Action) {
    if (pendingFocus) {
      return {
        activePlayerName,
        interactionLabel: "Focus is armed",
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
        roundLabel,
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
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose focus, move, charge, guard, or attack.",
      isArmed: false,
      stepLabel: "Action Step",
      tone: "action",
      roundLabel,
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
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose a power play, delve, or pass.",
      isArmed: false,
      stepLabel: "Power Step",
      tone: "power",
      roundLabel,
    };
  }

  return {
    activePlayerName,
    interactionLabel: "Board is waiting for the next step.",
    isArmed: false,
    stepLabel: "Board State",
    tone: "neutral",
    roundLabel,
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
