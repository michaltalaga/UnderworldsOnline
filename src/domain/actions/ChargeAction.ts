import {
  AttackDieFace,
  GameActionKind,
  SaveDieFace,
  WeaponAbilityKind,
} from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { HexCell } from "../state/HexCell";
import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import { ChargeAbility } from "../abilities/ChargeAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class ChargeAction extends GameAction {
  public readonly fighter: Fighter;
  public readonly path: HexCell[];
  public readonly target: Fighter;
  public readonly weapon: WeaponDefinition;
  public readonly selectedAbility: WeaponAbilityKind | null;
  public readonly attackRoll: AttackDieFace[] | null;
  public readonly saveRoll: SaveDieFace[] | null;

  public constructor(
    player: Player,
    fighter: Fighter,
    path: HexCell[],
    target: Fighter,
    weapon: WeaponDefinition,
    selectedAbility: WeaponAbilityKind | null = null,
    attackRoll: AttackDieFace[] | null = null,
    saveRoll: SaveDieFace[] | null = null,
  ) {
    super(GameActionKind.Charge, player);
    this.fighter = fighter;
    this.path = path;
    this.target = target;
    this.weapon = weapon;
    this.selectedAbility = selectedAbility;
    this.attackRoll = attackRoll;
    this.saveRoll = saveRoll;
  }
}

const chargeAbility = new ChargeAbility();

export const ChargeActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    if (hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return chargeAbility.getLegalActions(game, player);
  },
};
