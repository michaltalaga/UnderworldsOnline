import { EndPhaseActionService } from "../endPhase/EndPhaseActionService";
import { GameEngine } from "../engine/GameEngine";
import { deterministicFirstPlayerRollOff } from "../rules/Dice";
import { CombatActionService } from "../rules/CombatActionService";
import type { Game } from "../state/Game";
import { Phase } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { CombatController } from "./CombatController";

// ---------------------------------------------------------------------------
// CombatAutoResolver
// ---------------------------------------------------------------------------
// A small facade that advances a combat game by asking the active
// player's `CombatController` for an action and applying it, plus
// draining the deterministic end phase without any controller at all.
//
// This mirrors `SetupAutoResolver` for the setup phase. The React layer
// calls `resolveAutomaticStep(game)` on a short timer after every state
// change; when the active seat is a human, the controller returns null
// and the loop stops, waiting for UI-submitted actions. When the active
// seat is an AI, the loop keeps firing one action at a time (with a
// display delay managed by the caller) so the user can watch it play.
//
// Swapping a player between human and AI is just swapping the entry in
// the `controllers` map passed into the constructor — nothing else in
// the app needs to change.

const MAX_DRAIN_ITERATIONS = 500;

export class CombatAutoResolver {
  private readonly controllers: ReadonlyMap<PlayerId, CombatController>;
  private readonly localPlayerId: PlayerId;
  private readonly engine: GameEngine;
  private readonly combatService: CombatActionService;
  private readonly endPhaseService: EndPhaseActionService;

  public constructor(
    controllers: ReadonlyMap<PlayerId, CombatController>,
    localPlayerId: PlayerId,
    engine: GameEngine = new GameEngine(),
    combatService: CombatActionService = new CombatActionService(),
    endPhaseService: EndPhaseActionService = new EndPhaseActionService(),
  ) {
    this.controllers = controllers;
    this.localPlayerId = localPlayerId;
    this.engine = engine;
    this.combatService = combatService;
    this.endPhaseService = endPhaseService;
  }

  // Whether the active seat is driven by a human. The UI uses this to
  // decide whether to enable click handlers, show quick-action buttons,
  // etc. Returns true when there is no active player so the UI never
  // gets locked by a transitional null state.
  public isHumanTurn(game: Game): boolean {
    if (game.activePlayerId === null) {
      return true;
    }
    const controller = this.controllers.get(game.activePlayerId);
    return controller === undefined || controller.kind === "local";
  }

  // Applies one auto-resolvable step if possible. Returns true when
  // anything was applied so the caller can trigger a re-render and
  // schedule the next step.
  //
  //   1. If the game is in the end phase, apply the next deterministic
  //      end-phase action (there's exactly one per step).
  //   2. If the game is in `combatReady` (between rounds), start the
  //      next combat round with a deterministic roll-off so play
  //      resumes without user input.
  //   3. Otherwise, if the active seat is an AI controller, ask it for
  //      an action and apply it.
  //   4. Otherwise, return false — the human UI drives.
  public resolveAutomaticStep(game: Game): boolean {
    if (game.phase === Phase.Finished) {
      return false;
    }

    if (game.phase === Phase.End) {
      return this.tryApplyEndPhaseStep(game);
    }

    if (game.isCombatReady()) {
      this.engine.startCombatRound(
        game,
        [deterministicFirstPlayerRollOff],
        this.localPlayerId,
      );
      return true;
    }

    if (!game.isInCombatTurn() || game.activePlayerId === null) {
      return false;
    }

    const controller = this.controllers.get(game.activePlayerId);
    if (controller === undefined || controller.kind === "local") {
      return false;
    }

    const legalActions = this.combatService.getLegalActions(game, game.activePlayerId);
    const action = controller.chooseAction(game, legalActions);
    if (action === null) {
      return false;
    }

    this.engine.applyGameAction(game, action);
    return true;
  }

  // Drains every auto-resolvable step in one synchronous loop. Intended
  // for tests and batch tooling — the UI uses `resolveAutomaticStep`
  // inside a timer so the user can see each step.
  public drainAll(game: Game): void {
    for (let step = 0; step < MAX_DRAIN_ITERATIONS; step += 1) {
      if (!this.resolveAutomaticStep(game)) {
        return;
      }
    }
  }

  // --- Private -----------------------------------------------------------

  private tryApplyEndPhaseStep(game: Game): boolean {
    const legalEndPhaseActions = this.endPhaseService.getLegalActions(game);
    if (legalEndPhaseActions.length === 0) {
      return false;
    }
    this.engine.applyEndPhaseAction(game, legalEndPhaseActions[0]);
    return true;
  }
}
