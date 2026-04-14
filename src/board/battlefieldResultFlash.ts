import {
  AttackAction,
  ChargeAction,
  DelveAction,
  FocusAction,
  GameRecordKind,
  MoveAction,
  PlayPloyAction,
  PlayUpgradeAction,
  UseWarscrollAbilityAction,
  type CombatResult,
  type Game,
} from "../domain";
import { compactHexId, formatFeatureTokenSide } from "./battlefieldFormatters";
import type { BattlefieldAppAction, BattlefieldResultFlash } from "./battlefieldModels";

// Maps a resolved game action to a short, tone-tagged flash card used by the
// result banner on the board. One per action kind; we return null when the
// action doesn't warrant a flash (e.g. nothing changed in the log).
export function buildBattlefieldResultFlash(
  game: Game,
  action: BattlefieldAppAction,
): BattlefieldResultFlash | null {
  const detail = game.eventLog[game.eventLog.length - 1];
  if (detail === undefined) {
    return null;
  }

  if (action instanceof MoveAction) {
    const destinationHexId = action.path[action.path.length - 1];
    return {
      id: Date.now(),
      tone: "move",
      title: `Moved to ${destinationHexId === undefined ? "destination" : compactHexId(destinationHexId)}`,
      detail,
    };
  }

  if (action instanceof AttackAction) {
    const combatResult = game.getLatestRecord(GameRecordKind.Combat);
    if (combatResult === null) {
      return null;
    }

    return {
      id: Date.now(),
      tone: "attack",
      title: buildCombatFlashTitle("attack", combatResult.damageInflicted, combatResult.outcome, combatResult.targetSlain),
      detail,
    };
  }

  if (action instanceof ChargeAction) {
    const combatResult = game.getLatestRecord(GameRecordKind.Combat);
    if (combatResult === null) {
      return null;
    }

    return {
      id: Date.now(),
      tone: "charge",
      title: buildCombatFlashTitle("charge", combatResult.damageInflicted, combatResult.outcome, combatResult.targetSlain),
      detail,
    };
  }

  if (action instanceof DelveAction) {
    const delveResult = game.getLatestRecord(GameRecordKind.Delve);
    return {
      id: Date.now(),
      tone: "power",
      title: delveResult === null
        ? "Delved feature token"
        : `Delved to ${formatFeatureTokenSide(delveResult.sideAfterDelve)}`,
      detail,
    };
  }

  if (action instanceof FocusAction) {
    const focusResult = game.getLatestRecord(GameRecordKind.Focus);
    const discardedCardCount =
      (focusResult?.discardedObjectives.length ?? 0) + (focusResult?.discardedPowerCards.length ?? 0);
    return {
      id: Date.now(),
      tone: "power",
      title: discardedCardCount === 0 ? "Focused hand" : `Focused ${discardedCardCount} card${discardedCardCount === 1 ? "" : "s"}`,
      detail,
    };
  }

  if (action instanceof PlayPloyAction) {
    const player = action.player;
    const card = player?.getCard(action.card.id);
    return {
      id: Date.now(),
      tone: "power",
      title: `Played ${card?.name ?? "ploy"}`,
      detail,
    };
  }

  if (action instanceof PlayUpgradeAction) {
    const player = action.player;
    const card = player?.getCard(action.card.id);
    return {
      id: Date.now(),
      tone: "power",
      title: `Equipped ${card?.name ?? "upgrade"}`,
      detail,
    };
  }

  if (action instanceof UseWarscrollAbilityAction) {
    const player = action.player;
    const ability = player?.getWarscrollDefinition()?.getAbility(action.abilityIndex);
    return {
      id: Date.now(),
      tone: "power",
      title: `Used ${ability?.name ?? "warscroll ability"}`,
      detail,
    };
  }

  return null;
}

function buildCombatFlashTitle(
  actionLabel: "attack" | "charge",
  damageInflicted: number,
  outcome: CombatResult["outcome"],
  targetSlain: boolean,
): string {
  const capitalizedAction = actionLabel[0].toUpperCase() + actionLabel.slice(1);

  if (targetSlain) {
    return `${capitalizedAction} slew target`;
  }

  if (outcome === "success") {
    return damageInflicted === 0
      ? `${capitalizedAction} landed`
      : `${capitalizedAction} hit for ${damageInflicted}`;
  }

  if (outcome === "draw") {
    return `${capitalizedAction} drawn`;
  }

  return `${capitalizedAction} missed`;
}
