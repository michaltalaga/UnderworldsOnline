import {
  AttackAction,
  ChargeAction,
  DelveAction,
  FocusAction,
  GuardAction,
  MoveAction,
  PassAction,
  type CardId,
  type FighterId,
  type Game,
  type GameAction,
  type HexId,
  type PlayerState,
} from "../domain";
import { formatWeaponAccuracy, getFighterName } from "./battlefieldFormatters";
import type {
  ArmedPathModel,
  AttackProfileSummary,
  ChargeProfileSummary,
  FighterActionLens,
  ProfilePreviewModel,
} from "./battlefieldModels";

// Derives a per-fighter view of the legal actions coming out of
// `CombatActionService`. The main battlefield component builds one lens per
// render and passes it to the map, the action panel, and the interaction
// handlers.
export function getFighterActionLens(
  game: Game,
  activePlayer: PlayerState | null,
  selectedFighterId: FighterId | null,
  legalActions: GameAction[],
): FighterActionLens {
  const passAction = legalActions.find(
    (action): action is PassAction => action instanceof PassAction,
  ) ?? null;
  const focusAction = legalActions.find(
    (action): action is FocusAction => action instanceof FocusAction,
  ) ?? null;

  if (activePlayer === null || selectedFighterId === null) {
    return createEmptyActionLens(passAction, focusAction);
  }

  const fighter = activePlayer.getFighter(selectedFighterId) ?? null;
  if (fighter === null) {
    return createEmptyActionLens(passAction, focusAction);
  }

  const attackActions = legalActions.filter(
    (action): action is AttackAction => action instanceof AttackAction && action.attackerId === selectedFighterId,
  );
  const moveActions = legalActions.filter(
    (action): action is MoveAction => action instanceof MoveAction && action.fighterId === selectedFighterId,
  );
  const chargeActions = legalActions.filter(
    (action): action is ChargeAction => action instanceof ChargeAction && action.fighterId === selectedFighterId,
  );
  const delveAction = legalActions.find(
    (action): action is DelveAction => action instanceof DelveAction && action.fighterId === selectedFighterId,
  ) ?? null;
  const guardAction = legalActions.find(
    (action): action is GuardAction => action instanceof GuardAction && action.fighterId === selectedFighterId,
  ) ?? null;

  const attackTargetIds = new Set<FighterId>(attackActions.map((action) => action.targetId));
  const attackTargetHexIds = new Set<HexId>(
    [...attackTargetIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target?.currentHexId === null || target?.currentHexId === undefined
        ? []
        : [target.currentHexId];
    }),
  );
  const moveHexIds = new Set<HexId>(
    moveActions.flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
  const chargeHexIds = new Set<HexId>(
    chargeActions.flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
  const chargeTargetIds = new Set<FighterId>(chargeActions.map((action) => action.targetId));
  const chargeTargetHexIds = new Set<HexId>(
    [...chargeTargetIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target?.currentHexId === null || target?.currentHexId === undefined
        ? []
        : [target.currentHexId];
    }),
  );
  const uniqueChargeOptions = new Set(
    chargeActions.flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [`${destinationHexId}:${action.targetId}`];
    }),
  );

  return {
    fighter,
    attackTargetHexIds,
    attackTargetIds,
    moveHexIds,
    chargeHexIds,
    chargeTargetHexIds,
    chargeTargetIds,
    attackActions,
    moveActions,
    chargeActions,
    delveAction,
    focusAction,
    guardAction,
    passAction,
    attackCount: attackTargetIds.size,
    moveCount: moveHexIds.size,
    chargeCount: uniqueChargeOptions.size,
    delveAvailable: delveAction !== null,
    focusAvailable: focusAction !== null,
    guardAvailable: guardAction !== null,
  };
}

export function createEmptyActionLens(
  passAction: PassAction | null,
  focusAction: FocusAction | null,
): FighterActionLens {
  return {
    fighter: null,
    attackTargetHexIds: new Set<HexId>(),
    attackTargetIds: new Set<FighterId>(),
    moveHexIds: new Set<HexId>(),
    chargeHexIds: new Set<HexId>(),
    chargeTargetHexIds: new Set<HexId>(),
    chargeTargetIds: new Set<FighterId>(),
    attackActions: [],
    moveActions: [],
    chargeActions: [],
    delveAction: null,
    focusAction,
    guardAction: null,
    passAction,
    attackCount: 0,
    moveCount: 0,
    chargeCount: 0,
    delveAvailable: false,
    focusAvailable: focusAction !== null,
    guardAvailable: false,
  };
}

export function toggleFocusCardId(current: CardId[], cardId: CardId): CardId[] {
  return current.includes(cardId)
    ? current.filter((currentCardId) => currentCardId !== cardId)
    : [...current, cardId];
}

export function getMoveOptions(actionLens: FighterActionLens): Array<{
  action: MoveAction;
  hexId: HexId;
  label: string;
}> {
  return actionLens.moveActions
    .flatMap((action) => {
      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined
        ? []
        : [{
          action,
          hexId: destinationHexId,
          label: `Move to ${destinationHexId} (${action.path.length} step${action.path.length === 1 ? "" : "s"})`,
        }];
    })
    .sort((left, right) => left.hexId.localeCompare(right.hexId));
}

export function getMoveActionForHex(actionLens: FighterActionLens, hexId: HexId): MoveAction | null {
  let bestAction: MoveAction | null = null;

  for (const action of actionLens.moveActions) {
    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId !== hexId) {
      continue;
    }

    if (bestAction === null || action.path.length < bestAction.path.length) {
      bestAction = action;
    }
  }

  return bestAction;
}

export function getChargePreviewActionForHex(
  actionLens: FighterActionLens,
  hexId: HexId,
): ChargeAction | null {
  let bestAction: ChargeAction | null = null;

  for (const action of getChargeActionsForHex(actionLens, hexId)) {
    if (
      bestAction === null ||
      action.path.length < bestAction.path.length ||
      (action.path.length === bestAction.path.length &&
        bestAction.selectedAbility !== null &&
        action.selectedAbility === null)
    ) {
      bestAction = action;
    }
  }

  return bestAction;
}

export function getChargeActionsForHex(actionLens: FighterActionLens, hexId: HexId): ChargeAction[] {
  return actionLens.chargeActions.filter((action) => action.path[action.path.length - 1] === hexId);
}

export function getChargeTargetIdsForHex(
  actionLens: FighterActionLens,
  hexId: HexId | null,
): Set<FighterId> {
  if (hexId === null) {
    return actionLens.chargeTargetIds;
  }

  return new Set(getChargeActionsForHex(actionLens, hexId).map((action) => action.targetId));
}

export function getChargeTargetHexIdsForHex(
  game: Game,
  actionLens: FighterActionLens,
  hexId: HexId | null,
): Set<HexId> {
  const targetIds = getChargeTargetIdsForHex(actionLens, hexId);

  return new Set(
    [...targetIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target?.currentHexId === null || target?.currentHexId === undefined
        ? []
        : [target.currentHexId];
    }),
  );
}

export function getChargeDestinationHexIdsForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId | null,
): Set<HexId> {
  if (targetId === null) {
    return new Set();
  }

  return new Set(
    actionLens.chargeActions.flatMap((action) => {
      if (action.targetId !== targetId) {
        return [];
      }

      const destinationHexId = action.path[action.path.length - 1];
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
}

export function getPreferredChargeDestinationForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId,
): HexId | null {
  let bestAction: ChargeAction | null = null;

  for (const action of actionLens.chargeActions) {
    if (action.targetId !== targetId) {
      continue;
    }

    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      continue;
    }

    const bestDestinationHexId = bestAction?.path[bestAction.path.length - 1];
    if (
      bestAction === null ||
      action.path.length < bestAction.path.length ||
      (action.path.length === bestAction.path.length &&
        bestAction.selectedAbility !== null &&
        action.selectedAbility === null) ||
      (action.path.length === bestAction.path.length &&
        bestAction.selectedAbility === action.selectedAbility &&
        bestDestinationHexId !== undefined &&
        destinationHexId.localeCompare(bestDestinationHexId) < 0)
    ) {
      bestAction = action;
    }
  }

  return bestAction?.path[bestAction.path.length - 1] ?? null;
}

export function getChargeActionForTarget(
  actionLens: FighterActionLens,
  hexId: HexId | null,
  targetId: FighterId,
  preferredChargeKey: string | null = null,
): ChargeAction | null {
  if (hexId === null) {
    return null;
  }

  if (preferredChargeKey !== null) {
    const preferredAction = getChargeActionsForHex(actionLens, hexId).find(
      (action) => action.targetId === targetId && getChargeActionKey(action) === preferredChargeKey,
    );
    if (preferredAction !== undefined) {
      return preferredAction;
    }
  }

  let bestAction: ChargeAction | null = null;

  for (const action of getChargeActionsForHex(actionLens, hexId)) {
    if (action.targetId !== targetId) {
      continue;
    }

    if (bestAction === null || (bestAction.selectedAbility !== null && action.selectedAbility === null)) {
      bestAction = action;
    }
  }

  return bestAction;
}

export function getChargeActionKey(action: ChargeAction): string {
  const destinationHexId = action.path[action.path.length - 1] ?? "unknown";
  return `${action.fighterId}:${destinationHexId}:${action.targetId}:${action.weaponId}:${action.selectedAbility ?? "base"}`;
}

export function getChargePairKey(
  destinationHexId: HexId,
  targetId: FighterId,
): string {
  return `${destinationHexId}:${targetId}`;
}

export function getSelectedChargeKeyForPair(
  selectedChargeKeysByPair: Record<string, string>,
  destinationHexId: HexId,
  targetId: FighterId,
): string | null {
  return selectedChargeKeysByPair[getChargePairKey(destinationHexId, targetId)] ?? null;
}

export function getAttackActionForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId,
  preferredAttackKey: string | null = null,
): AttackAction | null {
  if (preferredAttackKey !== null) {
    const preferredAction = actionLens.attackActions.find(
      (action) => action.targetId === targetId && getAttackActionKey(action) === preferredAttackKey,
    );
    if (preferredAction !== undefined) {
      return preferredAction;
    }
  }

  let bestAction: AttackAction | null = null;

  for (const action of actionLens.attackActions) {
    if (action.targetId !== targetId) {
      continue;
    }

    if (bestAction === null || (bestAction.selectedAbility !== null && action.selectedAbility === null)) {
      bestAction = action;
    }
  }

  return bestAction;
}

export function getAttackActionKey(action: AttackAction): string {
  return `${action.attackerId}:${action.targetId}:${action.weaponId}:${action.selectedAbility ?? "base"}`;
}

export function getSelectedAttackKeyForTarget(
  selectedAttackKeysByTarget: Record<string, string>,
  targetId: FighterId,
): string | null {
  return selectedAttackKeysByTarget[targetId] ?? null;
}

export function getArmedPathModel(
  actionLens: FighterActionLens,
  pendingMoveHexId: HexId | null,
  pendingChargeHexId: HexId | null,
  pendingChargeTargetId: FighterId | null,
  selectedChargeKeysByPair: Record<string, string>,
): ArmedPathModel | null {
  const moveAction =
    pendingMoveHexId === null ? null : getMoveActionForHex(actionLens, pendingMoveHexId);

  if (moveAction !== null) {
    return {
      tone: "move",
      stepByHexId: new Map(moveAction.path.map((hexId, index) => [hexId, index + 1])),
    };
  }

  if (pendingChargeHexId === null) {
    return null;
  }

  const selectedChargeAction =
    pendingChargeTargetId === null
      ? getChargePreviewActionForHex(actionLens, pendingChargeHexId)
      : getChargeActionForTarget(
          actionLens,
          pendingChargeHexId,
          pendingChargeTargetId,
          getSelectedChargeKeyForPair(selectedChargeKeysByPair, pendingChargeHexId, pendingChargeTargetId),
        );

  if (selectedChargeAction === null) {
    return null;
  }

  return {
    tone: "charge",
    stepByHexId: new Map(selectedChargeAction.path.map((hexId, index) => [hexId, index + 1])),
  };
}

export function getAttackPreviewByTarget(
  attackProfiles: AttackProfileSummary[],
): ProfilePreviewModel {
  return new Map(
    attackProfiles.map((profile) => {
      const labels = [...new Set(profile.options.map((option) => formatProfilePreviewLabel(option.label)))];
      return [profile.targetId, labels];
    }),
  );
}

export function getChargePreviewByTarget(
  activePlayer: PlayerState | null,
  actionLens: FighterActionLens,
): ProfilePreviewModel {
  if (activePlayer === null || actionLens.fighter === null || actionLens.chargeActions.length === 0) {
    return new Map();
  }

  const labelsByTarget = new Map<FighterId, Set<string>>();

  for (const action of actionLens.chargeActions) {
    const label = formatProfilePreviewLabel(
      describeWeaponProfile(activePlayer, action.fighterId, action.weaponId, action.selectedAbility).label,
    );
    const existingLabels = labelsByTarget.get(action.targetId);
    if (existingLabels === undefined) {
      labelsByTarget.set(action.targetId, new Set([label]));
    } else {
      existingLabels.add(label);
    }
  }

  return new Map(
    [...labelsByTarget.entries()].map(([targetId, labels]) => [targetId, [...labels]]),
  );
}

function formatProfilePreviewLabel(label: string): string {
  const abilityMarker = " using ";
  const compactLabel =
    label.includes(abilityMarker)
      ? label.slice(label.indexOf(abilityMarker) + abilityMarker.length)
      : label;

  return compactLabel.length <= 16 ? compactLabel : `${compactLabel.slice(0, 15)}…`;
}

export function getAttackProfiles(
  game: Game,
  activePlayer: PlayerState | null,
  actionLens: FighterActionLens,
  selectedAttackKeysByTarget: Record<string, string>,
): AttackProfileSummary[] {
  if (activePlayer === null || actionLens.fighter === null || actionLens.attackActions.length === 0) {
    return [];
  }

  const actionsByTarget = new Map<FighterId, AttackAction[]>();
  for (const action of actionLens.attackActions) {
    const existingActions = actionsByTarget.get(action.targetId);
    if (existingActions === undefined) {
      actionsByTarget.set(action.targetId, [action]);
    } else {
      existingActions.push(action);
    }
  }

  return [...actionsByTarget.entries()].map(([targetId, actions]) => {
    const defaultAction = getAttackActionForTarget(actionLens, targetId) ?? actions[0];
    const selectedAction = getAttackActionForTarget(
      actionLens,
      targetId,
      getSelectedAttackKeyForTarget(selectedAttackKeysByTarget, targetId),
    ) ?? defaultAction;

    return {
      targetId,
      targetName: getFighterName(game, targetId),
      defaultKey: getAttackActionKey(defaultAction),
      selectedKey: getAttackActionKey(selectedAction),
      options: actions.map((action) => {
        const description = describeAttackAction(activePlayer, action);
        return {
          key: getAttackActionKey(action),
          label: description.label,
          stats: description.stats,
          isDefault: action === defaultAction,
        };
      }),
    };
  });
}

export function getAttackProfileForTarget(
  attackProfiles: AttackProfileSummary[],
  targetId: FighterId,
): AttackProfileSummary | null {
  return attackProfiles.find((profile) => profile.targetId === targetId) ?? null;
}

export function getChargeProfiles(
  game: Game,
  activePlayer: PlayerState | null,
  actionLens: FighterActionLens,
  destinationHexId: HexId | null,
  selectedChargeKeysByPair: Record<string, string>,
): ChargeProfileSummary[] {
  if (
    activePlayer === null ||
    actionLens.fighter === null ||
    destinationHexId === null
  ) {
    return [];
  }

  const chargeActions = getChargeActionsForHex(actionLens, destinationHexId);
  if (chargeActions.length === 0) {
    return [];
  }

  const actionsByTarget = new Map<FighterId, ChargeAction[]>();
  for (const action of chargeActions) {
    const existingActions = actionsByTarget.get(action.targetId);
    if (existingActions === undefined) {
      actionsByTarget.set(action.targetId, [action]);
    } else {
      existingActions.push(action);
    }
  }

  return [...actionsByTarget.entries()].map(([targetId, actions]) => {
    const defaultAction = getChargeActionForTarget(actionLens, destinationHexId, targetId) ?? actions[0];
    const selectedAction = getChargeActionForTarget(
      actionLens,
      destinationHexId,
      targetId,
      getSelectedChargeKeyForPair(selectedChargeKeysByPair, destinationHexId, targetId),
    ) ?? defaultAction;

    return {
      targetId,
      targetName: getFighterName(game, targetId),
      defaultKey: getChargeActionKey(defaultAction),
      selectedKey: getChargeActionKey(selectedAction),
      options: actions.map((action) => {
        const description = describeWeaponProfile(activePlayer, action.fighterId, action.weaponId, action.selectedAbility);
        return {
          key: getChargeActionKey(action),
          label: description.label,
          stats: description.stats,
          isDefault: action === defaultAction,
        };
      }),
    };
  });
}

export function getChargeProfileForTarget(
  chargeProfiles: ChargeProfileSummary[],
  targetId: FighterId,
): ChargeProfileSummary | null {
  return chargeProfiles.find((profile) => profile.targetId === targetId) ?? null;
}

function describeAttackAction(
  player: PlayerState,
  action: AttackAction,
): {
  label: string;
  stats: string;
} {
  return describeWeaponProfile(player, action.attackerId, action.weaponId, action.selectedAbility);
}

function describeWeaponProfile(
  player: PlayerState,
  fighterId: FighterId,
  weaponId: string,
  selectedAbility: AttackAction["selectedAbility"] | ChargeAction["selectedAbility"],
): {
  label: string;
  stats: string;
} {
  const weapon = player.getFighterWeaponDefinition(fighterId, weaponId);
  if (weapon === undefined) {
    return {
      label: weaponId,
      stats: "",
    };
  }

  const selectedWeaponAbility = weapon.getAbility(selectedAbility);
  return {
    label: selectedWeaponAbility === null ? weapon.name : `${weapon.name} using ${selectedWeaponAbility.displayName}`,
    stats: `Range ${weapon.range} | ${weapon.dice} dice | ${formatWeaponAccuracy(weapon.accuracy)} | Dmg ${weapon.damage}`,
  };
}

export function getChargeOptions(
  game: Game,
  actionLens: FighterActionLens,
): Array<{
  action: ChargeAction;
  key: string;
  label: string;
}> {
  const byKey = new Map<string, ChargeAction>();

  for (const action of actionLens.chargeActions) {
    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      continue;
    }

    const key = `${destinationHexId}:${action.targetId}`;
    const existingAction = byKey.get(key);
    if (existingAction === undefined || (existingAction.selectedAbility !== null && action.selectedAbility === null)) {
      byKey.set(key, action);
    }
  }

  return [...byKey.entries()]
    .map(([key, action]) => {
      const destinationHexId = action.path[action.path.length - 1];
      const targetName = getFighterName(game, action.targetId);
      return destinationHexId === undefined
        ? null
        : {
          action,
          key,
          label: `Charge to ${destinationHexId} vs ${targetName}`,
        };
    })
    .filter((option): option is {
      action: ChargeAction;
      key: string;
      label: string;
    } => option !== null)
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getDefaultSelectableFighterId(game: Game): FighterId | null {
  const activePlayerId = game.activePlayerId;
  if (activePlayerId === null) {
    return null;
  }

  const activePlayer = game.getPlayer(activePlayerId);
  return activePlayer?.fighters.find((fighter) => !fighter.isSlain && fighter.currentHexId !== null)?.id ?? null;
}

export function getNextSelectedFighterId(
  game: Game,
  previousActivePlayerId: PlayerState["id"] | null,
  previousSelectedFighterId: FighterId | null,
): FighterId | null {
  if (
    game.activePlayerId !== null &&
    game.activePlayerId === previousActivePlayerId &&
    previousSelectedFighterId !== null
  ) {
    const activePlayer = game.getPlayer(game.activePlayerId);
    const fighter = activePlayer?.getFighter(previousSelectedFighterId);
    if (fighter !== undefined && !fighter.isSlain && fighter.currentHexId !== null) {
      return fighter.id;
    }
  }

  return getDefaultSelectableFighterId(game);
}
