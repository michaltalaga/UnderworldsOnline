import type { PlayerId } from "../values/ids";
import { GameAction } from "../actions/GameAction";
import { Game } from "../state/Game";

export abstract class LegalActionService {
  public abstract getLegalActions(game: Game, playerId: PlayerId): GameAction[];
}
