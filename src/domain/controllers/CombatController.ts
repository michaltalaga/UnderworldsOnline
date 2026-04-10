import { AttackAction } from "../actions/AttackAction";
import { ChargeAction } from "../actions/ChargeAction";
import { EndActionStepAction } from "../actions/EndActionStepAction";
import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import { PassAction } from "../actions/PassAction";
import type { Game } from "../state/Game";

// ---------------------------------------------------------------------------
// CombatController
// ---------------------------------------------------------------------------
// A CombatController decides which legal action the game engine should
// apply for a given player during combat. Each player in a game is owned
// by exactly one controller.
//
//   - `LocalPlayerController` returns null on every call — it means "a
//     human is at the keyboard; wait for the UI to submit an action".
//   - `DumbAiController` picks a legal action using a very shallow
//     heuristic (attacks > charges > moves > anything > pass). No
//     lookahead, no scoring, no card awareness.
//   - Future controllers (`SmartAiController`, `RemotePlayerController`,
//     `ReplayController`) just implement the same interface.
//
// The React app (`PracticeBattlefieldApp`) owns a `ReadonlyMap<PlayerId,
// CombatController>` and passes it to `CombatAutoResolver`. Changing who
// plays a given seat = swap the entry in that map. The rest of the app
// doesn't need to know or care.

export type CombatControllerKind = "local" | "dumb-ai";

export interface CombatController {
  readonly kind: CombatControllerKind;

  // Returns the action to apply, or `null` to defer to the UI. A return
  // value of `null` tells `CombatAutoResolver` to stop auto-advancing
  // and wait for a user-driven action to come in via `applyGameAction`.
  chooseAction(game: Game, legalActions: readonly GameAction[]): GameAction | null;
}

// ---------------------------------------------------------------------------
// LocalPlayerController — the "human at the keyboard" controller. Always
// returns null so the auto-resolver stops and the UI drives the turn.
// ---------------------------------------------------------------------------

export class LocalPlayerController implements CombatController {
  public readonly kind = "local" as const;

  public chooseAction(): GameAction | null {
    return null;
  }
}

// ---------------------------------------------------------------------------
// DumbAiController — picks a legal action using a shallow priority list.
// Intentionally dumb: no planning, no evaluation, no card play awareness.
// The goal is only to produce plausibly active play so a solo user can
// test combat end-to-end without hot-seating the second player.
// ---------------------------------------------------------------------------

export class DumbAiController implements CombatController {
  public readonly kind = "dumb-ai" as const;

  public chooseAction(
    _game: Game,
    legalActions: readonly GameAction[],
  ): GameAction | null {
    if (legalActions.length === 0) {
      return null;
    }

    // Priority order. "Do something useful" ≈ attack > charge > move >
    // anything else > pass. Ties are broken by picking a random option
    // in the winning bucket so the AI doesn't play identically every
    // game (without breaking determinism hard enough to confuse tests —
    // callers that need reproducibility can inject a seeded RNG later).
    const attacks = legalActions.filter((action) => action instanceof AttackAction);
    if (attacks.length > 0) {
      return pickRandom(attacks);
    }

    const charges = legalActions.filter((action) => action instanceof ChargeAction);
    if (charges.length > 0) {
      return pickRandom(charges);
    }

    const moves = legalActions.filter((action) => action instanceof MoveAction);
    if (moves.length > 0) {
      return pickRandom(moves);
    }

    // Prefer real actions over EndActionStep and Pass
    const nonTerminal = legalActions.filter(
      (action) => !(action instanceof PassAction) && !(action instanceof EndActionStepAction),
    );
    if (nonTerminal.length > 0) {
      return pickRandom(nonTerminal);
    }

    // No real actions left — end the action step if possible, otherwise pass
    const endStep = legalActions.find((action) => action instanceof EndActionStepAction);
    if (endStep !== undefined) {
      return endStep;
    }

    return legalActions[0] ?? null;
  }
}

function pickRandom<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  // `items.length > 0` is guaranteed by callers above; this assertion is
  // just to satisfy TS without an exclamation mark at every call site.
  return items[index] as T;
}
