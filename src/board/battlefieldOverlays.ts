import {
  CardKind,
  PlayPloyAction,
  PlayUpgradeAction,
  TurnStep,
  UseWarscrollAbilityAction,
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
  FocusOverlayModel,
  PowerOverlayModel,
  PowerOverlayOption,
} from "./battlefieldModels";

// Builders for the three overlay view models the board renders:
// * `focus`  — cards shown when Focus is armed
// * `power`  — ploys/upgrades/warscroll abilities during the power step
// * `boardTurnHeader` — top-of-map banner describing the current armed intent
//
// All three are pure projections of game state + UI intent, kept together
// here so they can evolve without touching the main battlefield component.

export function getFocusOverlayModel(
  game: Game,
  activePlayer: PlayerState | null,
): FocusOverlayModel {
  if (activePlayer === null || game.turnStep !== TurnStep.Action) {
    return {
      objectiveCards: [],
      powerCards: [],
      hasAnyCards: false,
    };
  }

  const objectiveCards = activePlayer.objectiveHand.map((card) => ({
    cardId: card.id,
    name: activePlayer.getCardDefinition(card.id)?.name ?? card.definitionId,
  }));
  const powerCards = activePlayer.powerHand.map((card) => ({
    cardId: card.id,
    name: activePlayer.getCardDefinition(card.id)?.name ?? card.definitionId,
  }));

  return {
    objectiveCards,
    powerCards,
    hasAnyCards: objectiveCards.length > 0 || powerCards.length > 0,
  };
}

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
  if (game.turnStep === TurnStep.Action) {
    if (pendingFocus) {
      return {
        activePlayerName,
        interactionLabel: "Focus is armed",
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    if (pendingGuardFighterId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Guard is armed for ${selectedFighterName}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
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
      };
    }

    if (pendingChargeHexId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Charge path armed at ${compactHexId(pendingChargeHexId)}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    if (pendingMoveHexId !== null) {
      return {
        activePlayerName,
        interactionLabel: `Move armed to ${compactHexId(pendingMoveHexId)}`,
        isArmed: true,
        stepLabel: "Action Step",
        tone: "action",
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose focus, move, charge, guard, or attack.",
      isArmed: false,
      stepLabel: "Action Step",
      tone: "action",
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
      };
    }

    if (pendingPassPower) {
      return {
        activePlayerName,
        interactionLabel: "Pass Power is armed",
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
      };
    }

    if (pendingPowerOption !== null) {
      return {
        activePlayerName,
        interactionLabel: `${pendingPowerOption.title} is armed`,
        isArmed: true,
        stepLabel: "Power Step",
        tone: "power",
      };
    }

    return {
      activePlayerName,
      interactionLabel: "Choose a power play, delve, or pass.",
      isArmed: false,
      stepLabel: "Power Step",
      tone: "power",
    };
  }

  return {
    activePlayerName,
    interactionLabel: "Board is waiting for the next step.",
    isArmed: false,
    stepLabel: "Board State",
    tone: "neutral",
  };
}
