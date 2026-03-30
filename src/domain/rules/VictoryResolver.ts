import { Game } from "../state/Game";
import { GameOutcome } from "./GameOutcome";

export abstract class VictoryResolver {
  public abstract getOutcome(game: Game): GameOutcome | null;
}
