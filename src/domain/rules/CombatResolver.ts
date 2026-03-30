import { Game } from "../state/Game";
import { CombatContext } from "./CombatContext";
import { CombatResult } from "./CombatResult";

export abstract class CombatResolver {
  public abstract resolve(game: Game, context: CombatContext): CombatResult;
}
