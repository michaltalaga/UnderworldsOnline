import type { GameAction, GameState } from "../engine/types";

export type NetworkMode = "local" | "host-authoritative-peer";

export interface MultiplayerAdapter {
  mode: NetworkMode;
  submitAction(action: GameAction): void;
  subscribe(handler: (state: GameState) => void): () => void;
  getState(): GameState;
}
