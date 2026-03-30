import { applyAction } from "../engine/engine";
import type { GameAction, GameState } from "../engine/types";
import type { MultiplayerAdapter } from "./types";

export class LocalHostAdapter implements MultiplayerAdapter {
  readonly mode = "local" as const;
  private state: GameState;
  private listeners = new Set<(state: GameState) => void>();

  constructor(initial: GameState) {
    this.state = initial;
  }

  submitAction(action: GameAction): void {
    this.state = applyAction(this.state, action);
    this.listeners.forEach((l) => l(this.state));
  }

  subscribe(handler: (state: GameState) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  getState(): GameState {
    return this.state;
  }
}
