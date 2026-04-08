import type { Game } from "../state/Game";
import type { PlayerId } from "../values/ids";
import { deterministicFirstPlayerRollOff } from "../rules/Dice";
import { GameEngine } from "../engine/GameEngine";
import { CompleteMusterAction } from "./CompleteMusterAction";
import { DrawStartingHandsAction } from "./DrawStartingHandsAction";
import { ResolveTerritoryRollOffAction } from "./ResolveTerritoryRollOffAction";
import type { SetupAction } from "./SetupAction";
import { SetupActionService } from "./SetupActionService";

// Game state kinds that represent an interactive setup decision owned by the
// active player. If the active player is the opponent, the resolver auto-
// picks the first legal action on their behalf.
const interactivePlayerSetupStates = new Set([
  "setupMulligan",
  "setupDetermineTerritoriesChoice",
  "setupPlaceFeatureTokens",
  "setupDeployFighters",
]);

// Outer bound on any drain loop so a bug in the engine can't spin us forever.
// Real setup only ever applies ~20 actions; 500 is a very wide margin.
const MAX_DRAIN_ITERATIONS = 500;

// SetupAutoResolver is a small facade over the setup engine + legal-action
// service. It owns three setup auto-resolution policies that SetupApp used to
// inline as ad-hoc useEffect logic:
//
//   1. `resolveAutomaticStep(game)` — one step of "safe" auto-resolution:
//      trivial advances (muster + draw) and opponent-owned actions. Used by
//      the React effect so the user only ever interacts as the local player.
//
//   2. `drainToBattle(game)` — keep applying legal actions until the game
//      reaches `combatReady`. Used by the "Skip to battle" test button.
//
//   3. `startCombat(game)` — begin the first combat round with a
//      deterministic roll-off so the local player always acts first. Used by
//      the combat-ready handoff effect.
//
// The class isolates the setup orchestration so SetupApp is a thin view and
// so these policies can be unit tested in isolation.
export class SetupAutoResolver {
  private readonly engine: GameEngine;
  private readonly service: SetupActionService;
  private readonly localPlayerId: PlayerId;

  public constructor(
    localPlayerId: PlayerId,
    engine: GameEngine = new GameEngine(),
    service: SetupActionService = new SetupActionService(),
  ) {
    this.engine = engine;
    this.service = service;
    this.localPlayerId = localPlayerId;
  }

  // Applies a user-submitted (or otherwise externally chosen) setup action.
  // Callers use this for clicks from the mulligan/territory/deployment
  // screens so all setup mutation flows through a single owner.
  public applyAction(game: Game, action: SetupAction): void {
    this.engine.applySetupAction(game, action);
  }

  // Applies one auto-resolvable setup step if any of the "safe" policies
  // match the current state. Returns true if anything was applied, so the
  // caller can trigger a re-render.
  public resolveAutomaticStep(game: Game): boolean {
    return this.tryResolveTrivial(game) || this.tryResolveOpponentAction(game);
  }

  // Keeps applying legal actions (falling back to the deterministic roll-off
  // where the service returns no actions) until the game reaches
  // `combatReady` or no further progress is possible.
  public drainToBattle(game: Game): void {
    for (let step = 0; step < MAX_DRAIN_ITERATIONS; step += 1) {
      if (game.state.kind === "combatReady") {
        return;
      }
      if (!this.tryResolveAnyAction(game)) {
        return;
      }
    }
  }

  // Starts the first combat round with a fixed roll-off that makes the local
  // player the first to act. SetupApp calls this exactly once when the state
  // transitions to `combatReady`.
  public startCombat(game: Game): void {
    this.engine.startCombatRound(game, [deterministicFirstPlayerRollOff], this.localPlayerId);
  }

  // --- Private policies ---------------------------------------------------

  private tryResolveTrivial(game: Game): boolean {
    if (game.state.kind === "setupMusterWarbands") {
      this.engine.applySetupAction(game, new CompleteMusterAction());
      return true;
    }
    if (game.state.kind === "setupDrawStartingHands") {
      this.engine.applySetupAction(game, new DrawStartingHandsAction());
      return true;
    }
    return false;
  }

  private tryResolveOpponentAction(game: Game): boolean {
    if (
      game.activePlayerId === null ||
      game.activePlayerId === this.localPlayerId ||
      !interactivePlayerSetupStates.has(game.state.kind)
    ) {
      return false;
    }

    const legalActions = this.service.getLegalActions(game);
    if (legalActions.length === 0) {
      return false;
    }

    this.engine.applySetupAction(game, legalActions[0]);
    return true;
  }

  // Broadest policy: apply any legal action, or the deterministic roll-off
  // fallback for the one state that has no legal actions at all.
  private tryResolveAnyAction(game: Game): boolean {
    if (this.tryResolveTrivial(game)) {
      return true;
    }

    const legalActions = this.service.getLegalActions(game);
    if (legalActions.length > 0) {
      this.engine.applySetupAction(game, legalActions[0]);
      return true;
    }

    if (game.state.kind === "setupDetermineTerritoriesRollOff") {
      this.engine.applySetupAction(
        game,
        new ResolveTerritoryRollOffAction([deterministicFirstPlayerRollOff]),
      );
      return true;
    }

    return false;
  }
}
