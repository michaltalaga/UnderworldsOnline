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
  type Player,
} from "../domain";
import { formatWeaponAccuracy, getFighterName } from "./battlefieldFormatters";
import type {
  ArmedPathModel,
  AttackProfileSummary,
  ChargeProfileSummary,
  FighterActionLens,
  ProfilePreviewModel,
} from "./battlefieldModels";

// --- Small shared helpers -------------------------------------------------
//
// These collapse patterns that used to be repeated across the lens builder,
// the per-hex/per-target queries, and the profile builders below.

// Returns the final hex a move or charge action ends on, or undefined if
// the path is empty. Every helper that filters or groups by destination
// flows through this rather than repeating `action.path[action.path.length - 1]`.
function getDestinationHexId(action: MoveAction | ChargeAction): HexId | undefined {
  return action.path[action.path.length - 1];
}

// Flattens an iterable of fighter ids to the hex ids they currently occupy,
// dropping off-board or missing fighters. Used by the lens builder and the
// per-hex charge queries.
function collectCurrentHexIds(game: Game, fighterIds: Iterable<FighterId>): Set<HexId> {
  return new Set(
    [...fighterIds].flatMap((fighterId) => {
      const target = game.getFighter(fighterId);
      return target === undefined || target.currentHex === null
        ? []
        : [target.currentHex.id];
    }),
  );
}

// Buckets actions by their target fighter so profile builders can walk the
// groups without re-implementing the grouping inline.
function groupByTargetId<T extends { readonly target: { readonly id: FighterId } }>(
  actions: readonly T[],
): Map<FighterId, T[]> {
  const byTarget = new Map<FighterId, T[]>();
  for (const action of actions) {
    const existing = byTarget.get(action.target.id);
    if (existing === undefined) {
      byTarget.set(action.target.id, [action]);
    } else {
      existing.push(action);
    }
  }
  return byTarget;
}

// Picks the best item from a list using a "is candidate better than current
// best" comparator. Returns null for an empty list. Used everywhere we used
// to write `let bestAction = null; for (...) { if (bestAction === null || ...) }`.
function pickBestBy<T>(
  items: readonly T[],
  isBetter: (candidate: T, current: T) => boolean,
): T | null {
  let best: T | null = null;
  for (const item of items) {
    if (best === null || isBetter(item, best)) {
      best = item;
    }
  }
  return best;
}

// Comparator: candidate is better than current if it drops an ability the
// current one has. Used by "find the plain (unmodified) version of this
// attack/charge" policies.
function prefersBaseAbility(
  candidate: { readonly selectedAbility: unknown },
  current: { readonly selectedAbility: unknown },
): boolean {
  return current.selectedAbility !== null && candidate.selectedAbility === null;
}

// Derives a per-fighter view of the legal actions coming out of
// `CombatActionService`. The main battlefield component builds one lens per
// render and passes it to the map, the action panel, and the interaction
// handlers.
export function getFighterActionLens(
  game: Game,
  activePlayer: Player | null,
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
    (action): action is AttackAction => action instanceof AttackAction && action.attacker.id === selectedFighterId,
  );
  const moveActions = legalActions.filter(
    (action): action is MoveAction => action instanceof MoveAction && action.fighter.id === selectedFighterId,
  );
  const chargeActions = legalActions.filter(
    (action): action is ChargeAction => action instanceof ChargeAction && action.fighter.id === selectedFighterId,
  );
  const delveAction = legalActions.find(
    (action): action is DelveAction => action instanceof DelveAction && action.fighter.id === selectedFighterId,
  ) ?? null;
  const guardAction = legalActions.find(
    (action): action is GuardAction => action instanceof GuardAction && action.fighter.id === selectedFighterId,
  ) ?? null;

  const attackTargetIds = new Set<FighterId>(attackActions.map((action) => action.target.id));
  const attackTargetHexIds = collectCurrentHexIds(game, attackTargetIds);
  const moveHexIds = new Set<HexId>(
    moveActions.flatMap((action) => {
      const destinationHexId = getDestinationHexId(action);
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
  const chargeHexIds = new Set<HexId>(
    chargeActions.flatMap((action) => {
      const destinationHexId = getDestinationHexId(action);
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
  const chargeTargetIds = new Set<FighterId>(chargeActions.map((action) => action.target.id));
  const chargeTargetHexIds = collectCurrentHexIds(game, chargeTargetIds);
  const uniqueChargeOptions = new Set(
    chargeActions.flatMap((action) => {
      const destinationHexId = getDestinationHexId(action);
      return destinationHexId === undefined ? [] : [`${destinationHexId}:${action.target.id}`];
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
      const destinationHexId = getDestinationHexId(action);
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
  const candidates = actionLens.moveActions.filter(
    (action) => getDestinationHexId(action) === hexId,
  );
  return pickBestBy(candidates, (candidate, current) => candidate.path.length < current.path.length);
}

export function getChargePreviewActionForHex(
  actionLens: FighterActionLens,
  hexId: HexId,
): ChargeAction | null {
  return pickBestBy(
    getChargeActionsForHex(actionLens, hexId),
    (candidate, current) =>
      candidate.path.length < current.path.length ||
      (candidate.path.length === current.path.length && prefersBaseAbility(candidate, current)),
  );
}

export function getChargeActionsForHex(actionLens: FighterActionLens, hexId: HexId): ChargeAction[] {
  return actionLens.chargeActions.filter((action) => getDestinationHexId(action) === hexId);
}

export function getChargeTargetIdsForHex(
  actionLens: FighterActionLens,
  hexId: HexId | null,
): Set<FighterId> {
  if (hexId === null) {
    return actionLens.chargeTargetIds;
  }

  return new Set(getChargeActionsForHex(actionLens, hexId).map((action) => action.target.id));
}

export function getChargeTargetHexIdsForHex(
  game: Game,
  actionLens: FighterActionLens,
  hexId: HexId | null,
): Set<HexId> {
  return collectCurrentHexIds(game, getChargeTargetIdsForHex(actionLens, hexId));
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
      if (action.target.id !== targetId) {
        return [];
      }

      const destinationHexId = getDestinationHexId(action);
      return destinationHexId === undefined ? [] : [destinationHexId];
    }),
  );
}

export function getPreferredChargeDestinationForTarget(
  actionLens: FighterActionLens,
  targetId: FighterId,
): HexId | null {
  const candidates = actionLens.chargeActions.filter(
    (action) => action.target.id === targetId && getDestinationHexId(action) !== undefined,
  );

  const bestAction = pickBestBy(candidates, (candidate, current) => {
    if (candidate.path.length !== current.path.length) {
      return candidate.path.length < current.path.length;
    }
    if (prefersBaseAbility(candidate, current)) {
      return true;
    }
    if (candidate.selectedAbility !== current.selectedAbility) {
      return false;
    }
    const candidateHexId = getDestinationHexId(candidate);
    const currentHexId = getDestinationHexId(current);
    return candidateHexId !== undefined &&
      currentHexId !== undefined &&
      candidateHexId.localeCompare(currentHexId) < 0;
  });

  return bestAction === null ? null : getDestinationHexId(bestAction) ?? null;
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

  const candidates = getChargeActionsForHex(actionLens, hexId).filter(
    (action) => action.target.id === targetId,
  );

  if (preferredChargeKey !== null) {
    const preferredAction = candidates.find(
      (action) => getChargeActionKey(action) === preferredChargeKey,
    );
    if (preferredAction !== undefined) {
      return preferredAction;
    }
  }

  return pickBestBy(candidates, prefersBaseAbility);
}

export function getChargeActionKey(action: ChargeAction): string {
  const destinationHexId = getDestinationHexId(action) ?? "unknown";
  return `${action.fighter.id}:${destinationHexId}:${action.target.id}:${action.weapon.id}:${action.selectedAbility ?? "base"}`;
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
  const candidates = actionLens.attackActions.filter(
    (action) => action.target.id === targetId,
  );

  if (preferredAttackKey !== null) {
    const preferredAction = candidates.find(
      (action) => getAttackActionKey(action) === preferredAttackKey,
    );
    if (preferredAction !== undefined) {
      return preferredAction;
    }
  }

  return pickBestBy(candidates, prefersBaseAbility);
}

export function getAttackActionKey(action: AttackAction): string {
  return `${action.attacker.id}:${action.target.id}:${action.weapon.id}:${action.selectedAbility ?? "base"}`;
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
  activePlayer: Player | null,
  actionLens: FighterActionLens,
): ProfilePreviewModel {
  if (activePlayer === null || actionLens.fighter === null || actionLens.chargeActions.length === 0) {
    return new Map();
  }

  const labelsByTarget = new Map<FighterId, Set<string>>();

  for (const action of actionLens.chargeActions) {
    const label = formatProfilePreviewLabel(
      describeWeaponProfile(activePlayer, action.fighter.id, action.weapon.id, action.selectedAbility).label,
    );
    const existingLabels = labelsByTarget.get(action.target.id);
    if (existingLabels === undefined) {
      labelsByTarget.set(action.target.id, new Set([label]));
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
  activePlayer: Player | null,
  actionLens: FighterActionLens,
  selectedAttackKeysByTarget: Record<string, string>,
): AttackProfileSummary[] {
  if (activePlayer === null || actionLens.fighter === null || actionLens.attackActions.length === 0) {
    return [];
  }

  return [...groupByTargetId(actionLens.attackActions).entries()].map(([targetId, actions]) => {
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

// Generic target-id lookup used by both attack and charge profile consumers.
// Both profile summary types carry `targetId`, so the generic works for
// either without needing two near-identical named exports.
export function getProfileForTarget<T extends { readonly targetId: FighterId }>(
  profiles: readonly T[],
  targetId: FighterId,
): T | null {
  return profiles.find((profile) => profile.targetId === targetId) ?? null;
}

export function getChargeProfiles(
  game: Game,
  activePlayer: Player | null,
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

  return [...groupByTargetId(chargeActions).entries()].map(([targetId, actions]) => {
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
        const description = describeWeaponProfile(activePlayer, action.fighter.id, action.weapon.id, action.selectedAbility);
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

function describeAttackAction(
  player: Player,
  action: AttackAction,
): {
  label: string;
  stats: string;
} {
  return describeWeaponProfile(player, action.attacker.id, action.weapon.id, action.selectedAbility);
}

function describeWeaponProfile(
  player: Player,
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
    const destinationHexId = getDestinationHexId(action);
    if (destinationHexId === undefined) {
      continue;
    }

    const key = `${destinationHexId}:${action.target.id}`;
    const existingAction = byKey.get(key);
    if (existingAction === undefined || prefersBaseAbility(action, existingAction)) {
      byKey.set(key, action);
    }
  }

  return [...byKey.entries()]
    .map(([key, action]) => {
      const destinationHexId = getDestinationHexId(action);
      const targetName = getFighterName(game, action.target.id);
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
  return activePlayer?.fighters.find((fighter) => !fighter.isSlain && fighter.currentHex !== null)?.id ?? null;
}

export function getNextSelectedFighterId(
  game: Game,
  previousActivePlayerId: Player["id"] | null,
  previousSelectedFighterId: FighterId | null,
): FighterId | null {
  if (
    game.activePlayerId !== null &&
    game.activePlayerId === previousActivePlayerId &&
    previousSelectedFighterId !== null
  ) {
    const activePlayer = game.activePlayer;
    const fighter = activePlayer?.getFighter(previousSelectedFighterId);
    if (fighter !== undefined && !fighter.isSlain && fighter.currentHex !== null) {
      return fighter.id;
    }
  }

  return getDefaultSelectableFighterId(game);
}
