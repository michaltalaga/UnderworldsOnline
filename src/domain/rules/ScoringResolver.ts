import type { PlayerId } from "../values/ids";
import { CardInstance } from "../state/CardInstance";
import { Game } from "../state/Game";

export abstract class ScoringResolver {
  public abstract getScorableObjectives(game: Game, playerId: PlayerId): CardInstance[];
}
