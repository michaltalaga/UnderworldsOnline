import type { Game, GameRecordKind } from "../domain";
import type { GameEvent } from "../domain/events/GameEvent";

/**
 * Assertion helpers — small, focused queries over the event log and
 * record log. Prefer these over direct `game.gameEvents` iteration so
 * tests read like "after a charge, there is a FighterMovedEvent".
 *
 * Never compare full event arrays in tests — one new event type breaks
 * hundreds of snapshots. Filter by type or kind instead.
 */

type EventConstructor<T extends GameEvent> = abstract new (...args: any[]) => T;

/** All events of the given class, in chronological order. */
export function findEvents<T extends GameEvent>(
  game: Game,
  type: EventConstructor<T>,
): T[] {
  return game.getEventsOfType(type);
}

/** The most recent event of the given class, or null. */
export function findLatestEvent<T extends GameEvent>(
  game: Game,
  type: EventConstructor<T>,
): T | null {
  return game.getLatestEventOfType(type);
}

/** Event count filtered by type. Shortcut for `findEvents(...).length`. */
export function countEvents<T extends GameEvent>(
  game: Game,
  type: EventConstructor<T>,
): number {
  return game.getEventsOfType(type).length;
}

/** All records (typed resolutions) with the given kind. */
export function findRecords<TKind extends GameRecordKind>(game: Game, kind: TKind) {
  return game.getEventHistory(kind);
}

/** The most recent record's data for the given kind, or null. */
export function findLatestRecord<TKind extends GameRecordKind>(game: Game, kind: TKind) {
  return game.getLatestRecord(kind);
}

/** Record count filtered by kind. */
export function countRecords<TKind extends GameRecordKind>(game: Game, kind: TKind): number {
  return game.getEventHistory(kind).length;
}
