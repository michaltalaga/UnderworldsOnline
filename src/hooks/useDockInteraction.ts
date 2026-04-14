import {
  ResolveMulliganAction,
  TurnStep,
  type CardId,
  type Game,
  type Player,
} from "../domain";
import { LOCAL_PLAYER_ID } from "../localPlayer";
import type { DockInteraction } from "../PlayerHandDock";
import type { PowerOverlayOption } from "../board/battlefieldModels";

export type UseDockInteractionParams = {
  game: Game;
  isSetup: boolean;
  isHumanTurn: boolean;
  localPlayer: Player | null;
  pendingFocus: boolean;
  selectedFocusObjectiveIds: CardId[];
  selectedFocusPowerIds: CardId[];
  focusSelectionSummary: string;
  handPowerPlayable: Map<CardId, PowerOverlayOption[]>;
  pendingPlayCardId: CardId | null;
  pendingPowerOptionKey: string | null;
  applySetupAction: (action: ResolveMulliganAction) => void;
  toggleFocusObjectiveCard: (cardId: CardId) => void;
  toggleFocusPowerCard: (cardId: CardId) => void;
  focusHand: () => void;
  clearPendingInteractions: () => void;
  handleDockSelectCard: (cardId: CardId) => void;
  selectPowerOption: (option: PowerOverlayOption) => void;
};

export function useDockInteraction({
  game,
  isSetup,
  isHumanTurn,
  localPlayer,
  pendingFocus,
  selectedFocusObjectiveIds,
  selectedFocusPowerIds,
  focusSelectionSummary,
  handPowerPlayable,
  pendingPlayCardId,
  pendingPowerOptionKey,
  applySetupAction,
  toggleFocusObjectiveCard,
  toggleFocusPowerCard,
  focusHand,
  clearPendingInteractions,
  handleDockSelectCard,
  selectPowerOption,
}: UseDockInteractionParams): DockInteraction {
  // Setup mulligan
  if (
    isSetup &&
    localPlayer !== null &&
    game.state.kind === "setupMulligan" &&
    game.activePlayerId === LOCAL_PLAYER_ID
  ) {
    return {
      kind: "mulligan",
      onResolve: (redrawObjectives: boolean, redrawPower: boolean) =>
        applySetupAction(
          new ResolveMulliganAction(localPlayer, redrawObjectives, redrawPower),
        ),
    };
  }

  // During AI turns the dock is read-only.
  if (!isHumanTurn) {
    return { kind: "readonly" };
  }

  // Combat focus mode
  if (game.turnStep === TurnStep.Action && pendingFocus) {
    return {
      kind: "focus",
      selectedObjectiveIds: selectedFocusObjectiveIds,
      selectedPowerIds: selectedFocusPowerIds,
      onToggleObjective: toggleFocusObjectiveCard,
      onTogglePower: toggleFocusPowerCard,
      onConfirm: focusHand,
      onCancel: clearPendingInteractions,
      summary: focusSelectionSummary,
    };
  }

  // Combat power card play
  if (handPowerPlayable.size > 0) {
    return {
      kind: "play",
      playableByCardId: handPowerPlayable,
      pendingCardId: pendingPlayCardId,
      pendingOptionKey: pendingPowerOptionKey,
      onSelectCard: handleDockSelectCard,
      onSelectOption: selectPowerOption,
      onCancel: clearPendingInteractions,
    };
  }

  return { kind: "readonly" };
}
