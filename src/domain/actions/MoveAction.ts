import type { HexId } from "../values/ids";
import { GameActionKind } from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import { MoveAbility } from "../abilities/MoveAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class MoveAction extends GameAction {
  public readonly fighter: Fighter;
  public readonly path: HexId[];

  public constructor(player: Player, fighter: Fighter, path: HexId[]) {
    super(GameActionKind.Move, player);
    this.fighter = fighter;
    this.path = path;
  }
}

const moveAbility = new MoveAbility();

export const MoveActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    if (hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return moveAbility.getLegalActions(game, player);
  },
};
