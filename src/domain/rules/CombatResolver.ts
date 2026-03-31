import { Game } from "../state/Game";
import type { AttackDieFace, SaveDieFace } from "../values/enums";
import { CombatContext } from "./CombatContext";
import { CombatResult } from "./CombatResult";

export abstract class CombatResolver {
  public abstract resolve(
    game: Game,
    context: CombatContext,
    attackRoll?: readonly AttackDieFace[] | null,
    saveRoll?: readonly SaveDieFace[] | null,
  ): CombatResult;
}
