import type { GameEvent, GameEventDataByKind, GameEventKind } from "./GameRecord";

export class GameEventLogState {
  public readonly events: readonly GameEvent[];
  public readonly batchStartIndex: number;

  public constructor(events: readonly GameEvent[], batchStartIndex: number = 0) {
    this.events = events;
    this.batchStartIndex = Math.max(0, Math.min(batchStartIndex, events.length));
  }

  public getLatestEvent<TKind extends GameEventKind>(
    kind: TKind,
  ): GameEvent<TKind> | null {
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      const event = this.events[index];
      if (event.kind === kind) {
        return event as GameEvent<TKind>;
      }
    }

    return null;
  }

  public getEventHistory<TKind extends GameEventKind>(
    kind: TKind,
  ): GameEvent<TKind>[] {
    return this.events.flatMap((event) =>
      event.kind === kind ? [event as GameEvent<TKind>] : [],
    );
  }

  public getLatestBatchEvent<TKind extends GameEventKind>(
    kind: TKind,
  ): GameEvent<TKind> | null {
    for (let index = this.events.length - 1; index >= this.batchStartIndex; index -= 1) {
      const event = this.events[index];
      if (event.kind === kind) {
        return event as GameEvent<TKind>;
      }
    }

    return null;
  }

  public getBatchEventHistory<TKind extends GameEventKind>(
    kind: TKind,
  ): GameEvent<TKind>[] {
    return this.events.slice(this.batchStartIndex).flatMap((event) =>
      event.kind === kind ? [event as GameEvent<TKind>] : [],
    );
  }

  public getLatestData<TKind extends GameEventKind>(
    kind: TKind,
  ): GameEventDataByKind[TKind] | null {
    return this.getLatestEvent(kind)?.data ?? null;
  }

  public getHistoryData<TKind extends GameEventKind>(
    kind: TKind,
  ): GameEventDataByKind[TKind][] {
    return this.getEventHistory(kind).map((event) => event.data);
  }
}
