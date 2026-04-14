import { EndPhaseStep, Phase, SetupStep, TurnStep } from "../values/enums";
import type { Player } from "./Player";

type GameStateBase<Kind extends string> = {
  readonly kind: Kind;
  readonly phase: Phase;
  readonly setupStep: SetupStep | null;
  readonly turnStep: TurnStep | null;
  readonly endPhaseStep: EndPhaseStep | null;
  readonly activePlayer: Player | null;
  readonly firstPlayer: Player | null;
  readonly priorityPlayer: Player | null;
};

type SetupGameStateBase<Kind extends string, Step extends SetupStep, ActivePlayer extends Player | null> =
  GameStateBase<Kind> & {
    readonly phase: typeof Phase.Setup;
    readonly setupStep: Step;
    readonly turnStep: null;
    readonly endPhaseStep: null;
    readonly activePlayer: ActivePlayer;
    readonly firstPlayer: null;
    readonly priorityPlayer: null;
  };

type CombatGameStateBase<
  Kind extends string,
  Turn extends TurnStep | null,
  ActivePlayer extends Player | null,
  FirstPlayer extends Player | null,
  PriorityPlayer extends Player | null,
> = GameStateBase<Kind> & {
  readonly phase: typeof Phase.Combat;
  readonly setupStep: typeof SetupStep.Complete;
  readonly turnStep: Turn;
  readonly endPhaseStep: null;
  readonly activePlayer: ActivePlayer;
  readonly firstPlayer: FirstPlayer;
  readonly priorityPlayer: PriorityPlayer;
};

export type SetupMusterWarbandsGameState = SetupGameStateBase<
  "setupMusterWarbands",
  typeof SetupStep.MusterWarbands,
  null
>;

export type SetupDrawStartingHandsGameState = SetupGameStateBase<
  "setupDrawStartingHands",
  typeof SetupStep.DrawStartingHands,
  null
>;

export type SetupMulliganGameState = SetupGameStateBase<
  "setupMulligan",
  typeof SetupStep.Mulligan,
  Player
>;

export type SetupDetermineTerritoriesRollOffGameState = SetupGameStateBase<
  "setupDetermineTerritoriesRollOff",
  typeof SetupStep.DetermineTerritories,
  null
>;

export type SetupDetermineTerritoriesChoiceGameState = SetupGameStateBase<
  "setupDetermineTerritoriesChoice",
  typeof SetupStep.DetermineTerritories,
  Player
>;

export type SetupPlaceFeatureTokensGameState = SetupGameStateBase<
  "setupPlaceFeatureTokens",
  typeof SetupStep.PlaceFeatureTokens,
  Player
>;

export type SetupDeployFightersGameState = SetupGameStateBase<
  "setupDeployFighters",
  typeof SetupStep.DeployFighters,
  Player
>;

export type CombatReadyGameState = CombatGameStateBase<
  "combatReady",
  null,
  null,
  null,
  null
>;

export type CombatChooseFirstPlayerGameState = CombatGameStateBase<
  "combatChooseFirstPlayer",
  null,
  null,
  null,
  Player
>;

export type CombatTurnGameState = CombatGameStateBase<
  "combatTurn",
  TurnStep,
  Player,
  Player,
  null
>;

export type EndPhaseGameState = GameStateBase<"endPhase"> & {
  readonly phase: typeof Phase.End;
  readonly setupStep: typeof SetupStep.Complete;
  readonly turnStep: null;
  readonly endPhaseStep: EndPhaseStep;
  readonly activePlayer: Player | null;
  readonly firstPlayer: Player | null;
  readonly priorityPlayer: null;
};

export type FinishedGameState = GameStateBase<"finished"> & {
  readonly phase: typeof Phase.Finished;
  readonly setupStep: typeof SetupStep.Complete;
  readonly turnStep: null;
  readonly endPhaseStep: null;
  readonly activePlayer: null;
  readonly firstPlayer: null;
  readonly priorityPlayer: null;
};

export type GameState =
  | SetupMusterWarbandsGameState
  | SetupDrawStartingHandsGameState
  | SetupMulliganGameState
  | SetupDetermineTerritoriesRollOffGameState
  | SetupDetermineTerritoriesChoiceGameState
  | SetupPlaceFeatureTokensGameState
  | SetupDeployFightersGameState
  | CombatReadyGameState
  | CombatChooseFirstPlayerGameState
  | CombatTurnGameState
  | EndPhaseGameState
  | FinishedGameState;

export type GameStateKind = GameState["kind"];

export function createSetupMusterWarbandsGameState(): SetupMusterWarbandsGameState {
  return {
    kind: "setupMusterWarbands",
    phase: Phase.Setup,
    setupStep: SetupStep.MusterWarbands,
    turnStep: null,
    endPhaseStep: null,
    activePlayer: null,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createSetupDrawStartingHandsGameState(): SetupDrawStartingHandsGameState {
  return {
    kind: "setupDrawStartingHands",
    phase: Phase.Setup,
    setupStep: SetupStep.DrawStartingHands,
    turnStep: null,
    endPhaseStep: null,
    activePlayer: null,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createSetupMulliganGameState(
  activePlayer: Player,
): SetupMulliganGameState {
  return {
    kind: "setupMulligan",
    phase: Phase.Setup,
    setupStep: SetupStep.Mulligan,
    turnStep: null,
    endPhaseStep: null,
    activePlayer,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createSetupDetermineTerritoriesRollOffGameState(): SetupDetermineTerritoriesRollOffGameState {
  return {
    kind: "setupDetermineTerritoriesRollOff",
    phase: Phase.Setup,
    setupStep: SetupStep.DetermineTerritories,
    turnStep: null,
    endPhaseStep: null,
    activePlayer: null,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createSetupDetermineTerritoriesChoiceGameState(
  activePlayer: Player,
): SetupDetermineTerritoriesChoiceGameState {
  return {
    kind: "setupDetermineTerritoriesChoice",
    phase: Phase.Setup,
    setupStep: SetupStep.DetermineTerritories,
    turnStep: null,
    endPhaseStep: null,
    activePlayer,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createSetupPlaceFeatureTokensGameState(
  activePlayer: Player,
): SetupPlaceFeatureTokensGameState {
  return {
    kind: "setupPlaceFeatureTokens",
    phase: Phase.Setup,
    setupStep: SetupStep.PlaceFeatureTokens,
    turnStep: null,
    endPhaseStep: null,
    activePlayer,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createSetupDeployFightersGameState(
  activePlayer: Player,
): SetupDeployFightersGameState {
  return {
    kind: "setupDeployFighters",
    phase: Phase.Setup,
    setupStep: SetupStep.DeployFighters,
    turnStep: null,
    endPhaseStep: null,
    activePlayer,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createCombatReadyGameState(): CombatReadyGameState {
  return {
    kind: "combatReady",
    phase: Phase.Combat,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep: null,
    activePlayer: null,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function createCombatChooseFirstPlayerGameState(
  priorityPlayer: Player,
): CombatChooseFirstPlayerGameState {
  return {
    kind: "combatChooseFirstPlayer",
    phase: Phase.Combat,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep: null,
    activePlayer: null,
    firstPlayer: null,
    priorityPlayer,
  };
}

export function createCombatTurnGameState(
  firstPlayer: Player,
  activePlayer: Player,
  turnStep: TurnStep,
): CombatTurnGameState {
  return {
    kind: "combatTurn",
    phase: Phase.Combat,
    setupStep: SetupStep.Complete,
    turnStep,
    endPhaseStep: null,
    activePlayer,
    firstPlayer,
    priorityPlayer: null,
  };
}

export function createEndPhaseGameState(
  endPhaseStep: EndPhaseStep,
  activePlayer: Player | null = null,
  firstPlayer: Player | null = null,
): EndPhaseGameState {
  return {
    kind: "endPhase",
    phase: Phase.End,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep,
    activePlayer,
    firstPlayer,
    priorityPlayer: null,
  };
}

export function createFinishedGameState(): FinishedGameState {
  return {
    kind: "finished",
    phase: Phase.Finished,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep: null,
    activePlayer: null,
    firstPlayer: null,
    priorityPlayer: null,
  };
}

export function canTransitionGameState(current: GameState, next: GameState): boolean {
  switch (current.kind) {
    case "setupMusterWarbands":
      return next.kind === "setupDrawStartingHands";
    case "setupDrawStartingHands":
      return next.kind === "setupMulligan";
    case "setupMulligan":
      return next.kind === "setupMulligan" || next.kind === "setupDetermineTerritoriesRollOff";
    case "setupDetermineTerritoriesRollOff":
      return next.kind === "setupDetermineTerritoriesChoice";
    case "setupDetermineTerritoriesChoice":
      return next.kind === "setupPlaceFeatureTokens";
    case "setupPlaceFeatureTokens":
      return next.kind === "setupPlaceFeatureTokens" || next.kind === "setupDeployFighters";
    case "setupDeployFighters":
      return next.kind === "setupDeployFighters" || next.kind === "combatReady";
    case "combatReady":
      return next.kind === "combatChooseFirstPlayer" || next.kind === "finished";
    case "combatChooseFirstPlayer":
      return next.kind === "combatTurn" || next.kind === "finished";
    case "combatTurn":
      return next.kind === "combatTurn" || next.kind === "endPhase" || next.kind === "finished";
    case "endPhase":
      return next.kind === "endPhase" || next.kind === "combatReady" || next.kind === "finished";
    case "finished":
      return false;
    default: {
      const exhaustiveState: never = current;
      throw new Error(`Unsupported game state ${(exhaustiveState as GameState).kind}.`);
    }
  }
}
