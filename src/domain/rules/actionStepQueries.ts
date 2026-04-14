import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { ActionStepStartedEvent } from "../events/ActionStepStartedEvent";
import { FighterMovedEvent } from "../events/FighterMovedEvent";
import { FighterGuardedEvent } from "../events/FighterGuardedEvent";
import { FighterFocusedEvent } from "../events/FighterFocusedEvent";
import { CombatEndedEvent } from "../events/CombatEndedEvent";
import { GameActionKind } from "../values/enums";

/**
 * Has the given player used a core ability (Move, Guard, Focus, Attack, Charge)
 * during their current action step?
 *
 * Uses the event log instead of the old GameRecord system.
 */
export function hasUsedCoreAbilityThisActionStep(game: Game, player: Player): boolean {
  // Find the most recent ActionStepStartedEvent for this player
  const events = game.getEventsOfType(ActionStepStartedEvent);
  let latestActionStep: ActionStepStartedEvent | null = null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].player === player) {
      latestActionStep = events[i];
      break;
    }
  }
  if (latestActionStep === null) return false;

  const startIndex = game.gameEvents.indexOf(latestActionStep);

  // Scan forward from the action step start for any core ability event
  for (let i = startIndex + 1; i < game.gameEvents.length; i++) {
    const event = game.gameEvents[i];
    if (event.invokedByPlayer !== player) continue;

    if (event instanceof FighterMovedEvent && event.actionKind === GameActionKind.Move) return true;
    if (event instanceof FighterGuardedEvent) return true;
    if (event instanceof FighterFocusedEvent) return true;
    // CombatEndedEvent covers both Attack and Charge actions
    if (event instanceof CombatEndedEvent) return true;
  }
  return false;
}
