import { EndPhaseStep, Phase, SetupStep, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";

type GameStateBase<Kind extends string> = {
  readonly kind: Kind;
  readonly phase: Phase;
  readonly setupStep: SetupStep | null;
  readonly turnStep: TurnStep | null;
  readonly endPhaseStep: EndPhaseStep | null;
  readonly activePlayerId: PlayerId | null;
  readonly firstPlayerId: PlayerId | null;
  readonly priorityPlayerId: PlayerId | null;
};

type SetupGameStateBase<Kind extends string, Step extends SetupStep, ActivePlayer extends PlayerId | null> =
  GameStateBase<Kind> & {
    readonly phase: typeof Phase.Setup;
    readonly setupStep: Step;
    readonly turnStep: null;
    readonly endPhaseStep: null;
    readonly activePlayerId: ActivePlayer;
    readonly firstPlayerId: null;
    readonly priorityPlayerId: null;
  };

type CombatGameStateBase<
  Kind extends string,
  Turn extends TurnStep | null,
  ActivePlayer extends PlayerId | null,
  FirstPlayer extends PlayerId | null,
  PriorityPlayer extends PlayerId | null,
> = GameStateBase<Kind> & {
  readonly phase: typeof Phase.Combat;
  readonly setupStep: typeof SetupStep.Complete;
  readonly turnStep: Turn;
  readonly endPhaseStep: null;
  readonly activePlayerId: ActivePlayer;
  readonly firstPlayerId: FirstPlayer;
  readonly priorityPlayerId: PriorityPlayer;
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
  PlayerId
>;

export type SetupDetermineTerritoriesRollOffGameState = SetupGameStateBase<
  "setupDetermineTerritoriesRollOff",
  typeof SetupStep.DetermineTerritories,
  null
>;

export type SetupDetermineTerritoriesChoiceGameState = SetupGameStateBase<
  "setupDetermineTerritoriesChoice",
  typeof SetupStep.DetermineTerritories,
  PlayerId
>;

export type SetupPlaceFeatureTokensGameState = SetupGameStateBase<
  "setupPlaceFeatureTokens",
  typeof SetupStep.PlaceFeatureTokens,
  PlayerId
>;

export type SetupDeployFightersGameState = SetupGameStateBase<
  "setupDeployFighters",
  typeof SetupStep.DeployFighters,
  PlayerId
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
  PlayerId
>;

export type CombatTurnGameState = CombatGameStateBase<
  "combatTurn",
  TurnStep,
  PlayerId,
  PlayerId,
  null
>;

export type EndPhaseGameState = GameStateBase<"endPhase"> & {
  readonly phase: typeof Phase.End;
  readonly setupStep: typeof SetupStep.Complete;
  readonly turnStep: null;
  readonly endPhaseStep: EndPhaseStep;
  readonly activePlayerId: PlayerId | null;
  readonly firstPlayerId: PlayerId | null;
  readonly priorityPlayerId: null;
};

export type FinishedGameState = GameStateBase<"finished"> & {
  readonly phase: typeof Phase.Finished;
  readonly setupStep: typeof SetupStep.Complete;
  readonly turnStep: null;
  readonly endPhaseStep: null;
  readonly activePlayerId: null;
  readonly firstPlayerId: null;
  readonly priorityPlayerId: null;
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

export type LegacyGameStateFields = {
  phase: Phase;
  setupStep: SetupStep | null;
  turnStep: TurnStep | null;
  endPhaseStep: EndPhaseStep | null;
  activePlayerId: PlayerId | null;
  firstPlayerId: PlayerId | null;
  priorityPlayerId: PlayerId | null;
};

export function createSetupMusterWarbandsGameState(): SetupMusterWarbandsGameState {
  return {
    kind: "setupMusterWarbands",
    phase: Phase.Setup,
    setupStep: SetupStep.MusterWarbands,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId: null,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createSetupDrawStartingHandsGameState(): SetupDrawStartingHandsGameState {
  return {
    kind: "setupDrawStartingHands",
    phase: Phase.Setup,
    setupStep: SetupStep.DrawStartingHands,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId: null,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createSetupMulliganGameState(
  activePlayerId: PlayerId,
): SetupMulliganGameState {
  return {
    kind: "setupMulligan",
    phase: Phase.Setup,
    setupStep: SetupStep.Mulligan,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createSetupDetermineTerritoriesRollOffGameState(): SetupDetermineTerritoriesRollOffGameState {
  return {
    kind: "setupDetermineTerritoriesRollOff",
    phase: Phase.Setup,
    setupStep: SetupStep.DetermineTerritories,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId: null,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createSetupDetermineTerritoriesChoiceGameState(
  activePlayerId: PlayerId,
): SetupDetermineTerritoriesChoiceGameState {
  return {
    kind: "setupDetermineTerritoriesChoice",
    phase: Phase.Setup,
    setupStep: SetupStep.DetermineTerritories,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createSetupPlaceFeatureTokensGameState(
  activePlayerId: PlayerId,
): SetupPlaceFeatureTokensGameState {
  return {
    kind: "setupPlaceFeatureTokens",
    phase: Phase.Setup,
    setupStep: SetupStep.PlaceFeatureTokens,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createSetupDeployFightersGameState(
  activePlayerId: PlayerId,
): SetupDeployFightersGameState {
  return {
    kind: "setupDeployFighters",
    phase: Phase.Setup,
    setupStep: SetupStep.DeployFighters,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createCombatReadyGameState(): CombatReadyGameState {
  return {
    kind: "combatReady",
    phase: Phase.Combat,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId: null,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createCombatChooseFirstPlayerGameState(
  priorityPlayerId: PlayerId,
): CombatChooseFirstPlayerGameState {
  return {
    kind: "combatChooseFirstPlayer",
    phase: Phase.Combat,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId: null,
    firstPlayerId: null,
    priorityPlayerId,
  };
}

export function createCombatTurnGameState(
  firstPlayerId: PlayerId,
  activePlayerId: PlayerId,
  turnStep: TurnStep,
): CombatTurnGameState {
  return {
    kind: "combatTurn",
    phase: Phase.Combat,
    setupStep: SetupStep.Complete,
    turnStep,
    endPhaseStep: null,
    activePlayerId,
    firstPlayerId,
    priorityPlayerId: null,
  };
}

export function createEndPhaseGameState(
  endPhaseStep: EndPhaseStep,
  activePlayerId: PlayerId | null = null,
  firstPlayerId: PlayerId | null = null,
): EndPhaseGameState {
  return {
    kind: "endPhase",
    phase: Phase.End,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep,
    activePlayerId,
    firstPlayerId,
    priorityPlayerId: null,
  };
}

export function createFinishedGameState(): FinishedGameState {
  return {
    kind: "finished",
    phase: Phase.Finished,
    setupStep: SetupStep.Complete,
    turnStep: null,
    endPhaseStep: null,
    activePlayerId: null,
    firstPlayerId: null,
    priorityPlayerId: null,
  };
}

export function createGameStateFromLegacyFields(fields: LegacyGameStateFields): GameState {
  switch (fields.phase) {
    case Phase.Setup:
      return createSetupStateFromLegacyFields(fields);
    case Phase.Combat:
      return createCombatStateFromLegacyFields(fields);
    case Phase.End:
      return createEndStateFromLegacyFields(fields);
    case Phase.Finished:
      return createFinishedStateFromLegacyFields(fields);
    default: {
      const exhaustivePhase: never = fields.phase;
      throw new Error(`Unsupported game phase ${exhaustivePhase}.`);
    }
  }
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
      return next.kind === "combatReady" || next.kind === "finished";
    case "finished":
      return false;
    default: {
      const exhaustiveState: never = current;
      throw new Error(`Unsupported game state ${(exhaustiveState as GameState).kind}.`);
    }
  }
}

function createSetupStateFromLegacyFields(fields: LegacyGameStateFields): GameState {
  switch (fields.setupStep) {
    case SetupStep.MusterWarbands:
      assertNoAncillaryState(fields, "Setup muster");
      return createSetupMusterWarbandsGameState();
    case SetupStep.DrawStartingHands:
      assertNoAncillaryState(fields, "Draw starting hands");
      return createSetupDrawStartingHandsGameState();
    case SetupStep.Mulligan:
      assertNull(fields.turnStep, "Mulligan turn step");
      assertNull(fields.endPhaseStep, "Mulligan end phase step");
      assertNull(fields.firstPlayerId, "Mulligan first player");
      assertNull(fields.priorityPlayerId, "Mulligan priority player");
      return createSetupMulliganGameState(requirePlayerId(fields.activePlayerId, "mulligan"));
    case SetupStep.DetermineTerritories:
      assertNull(fields.turnStep, "Territory choice turn step");
      assertNull(fields.endPhaseStep, "Territory choice end phase step");
      assertNull(fields.firstPlayerId, "Territory choice first player");
      assertNull(fields.priorityPlayerId, "Territory choice priority player");
      if (fields.activePlayerId === null) {
        return createSetupDetermineTerritoriesRollOffGameState();
      }

      return createSetupDetermineTerritoriesChoiceGameState(fields.activePlayerId);
    case SetupStep.PlaceFeatureTokens:
      assertNull(fields.turnStep, "Feature placement turn step");
      assertNull(fields.endPhaseStep, "Feature placement end phase step");
      assertNull(fields.firstPlayerId, "Feature placement first player");
      assertNull(fields.priorityPlayerId, "Feature placement priority player");
      return createSetupPlaceFeatureTokensGameState(
        requirePlayerId(fields.activePlayerId, "feature placement"),
      );
    case SetupStep.DeployFighters:
      assertNull(fields.turnStep, "Deployment turn step");
      assertNull(fields.endPhaseStep, "Deployment end phase step");
      assertNull(fields.firstPlayerId, "Deployment first player");
      assertNull(fields.priorityPlayerId, "Deployment priority player");
      return createSetupDeployFightersGameState(
        requirePlayerId(fields.activePlayerId, "deployment"),
      );
    case SetupStep.Complete:
      throw new Error("Setup cannot be complete while the game is still in the setup phase.");
    case null:
      throw new Error("Setup phase requires an active setup step.");
    default: {
      const exhaustiveStep: never = fields.setupStep;
      throw new Error(`Unsupported setup step ${exhaustiveStep}.`);
    }
  }
}

function createCombatStateFromLegacyFields(fields: LegacyGameStateFields): GameState {
  assertNull(fields.endPhaseStep, "Combat end phase step");
  if (fields.setupStep !== SetupStep.Complete) {
    throw new Error(
      `Combat phase expects setup step ${SetupStep.Complete}, got ${fields.setupStep}.`,
    );
  }

  if (fields.priorityPlayerId !== null) {
    assertNull(fields.activePlayerId, "First player chooser active player");
    assertNull(fields.firstPlayerId, "First player chooser first player");
    assertNull(fields.turnStep, "First player chooser turn step");
    return createCombatChooseFirstPlayerGameState(fields.priorityPlayerId);
  }

  if (fields.turnStep !== null) {
    return createCombatTurnGameState(
      requirePlayerId(fields.firstPlayerId, "combat first player"),
      requirePlayerId(fields.activePlayerId, "combat active player"),
      fields.turnStep,
    );
  }

  assertNull(fields.activePlayerId, "Combat ready active player");
  assertNull(fields.firstPlayerId, "Combat ready first player");
  return createCombatReadyGameState();
}

function createEndStateFromLegacyFields(fields: LegacyGameStateFields): GameState {
  if (fields.setupStep !== SetupStep.Complete) {
    throw new Error(`End phase expects setup step ${SetupStep.Complete}, got ${fields.setupStep}.`);
  }

  assertNull(fields.turnStep, "End phase turn step");
  assertNull(fields.priorityPlayerId, "End phase priority player");

  return createEndPhaseGameState(
    requireEndPhaseStep(fields.endPhaseStep),
    fields.activePlayerId,
    fields.firstPlayerId,
  );
}

function createFinishedStateFromLegacyFields(fields: LegacyGameStateFields): GameState {
  if (fields.setupStep !== SetupStep.Complete) {
    throw new Error(
      `Finished phase expects setup step ${SetupStep.Complete}, got ${fields.setupStep}.`,
    );
  }

  assertNull(fields.turnStep, "Finished phase turn step");
  assertNull(fields.endPhaseStep, "Finished phase end step");
  assertNull(fields.activePlayerId, "Finished phase active player");
  assertNull(fields.firstPlayerId, "Finished phase first player");
  assertNull(fields.priorityPlayerId, "Finished phase priority player");

  return createFinishedGameState();
}

function assertNoAncillaryState(fields: LegacyGameStateFields, label: string): void {
  assertNull(fields.turnStep, `${label} turn step`);
  assertNull(fields.endPhaseStep, `${label} end phase step`);
  assertNull(fields.activePlayerId, `${label} active player`);
  assertNull(fields.firstPlayerId, `${label} first player`);
  assertNull(fields.priorityPlayerId, `${label} priority player`);
}

function assertNull(value: unknown, label: string): void {
  if (value !== null) {
    throw new Error(`${label} must be null.`);
  }
}

function requirePlayerId(playerId: PlayerId | null, label: string): PlayerId {
  if (playerId === null) {
    throw new Error(`Expected ${label} player id.`);
  }

  return playerId;
}

function requireEndPhaseStep(endPhaseStep: EndPhaseStep | null): EndPhaseStep {
  if (endPhaseStep === null) {
    throw new Error("Expected an end phase step.");
  }

  return endPhaseStep;
}
