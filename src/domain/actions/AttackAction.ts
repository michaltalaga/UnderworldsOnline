import {
  AttackDieFace,
  GameActionKind,
  SaveDieFace,
  WeaponAbilityKind,
} from "../values/enums";
import { GameAction } from "./GameAction";
import type { LegalActionProvider } from "./LegalActionProvider";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { Fighter } from "../state/Fighter";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import { AttackAbility } from "../abilities/AttackAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class AttackAction extends GameAction {
  public readonly attacker: Fighter;
  public readonly target: Fighter;
  public readonly weapon: WeaponDefinition;
  public readonly selectedAbility: WeaponAbilityKind | null;
  public readonly attackRoll: AttackDieFace[] | null;
  public readonly saveRoll: SaveDieFace[] | null;

  public constructor(
    player: Player,
    attacker: Fighter,
    target: Fighter,
    weapon: WeaponDefinition,
    selectedAbility: WeaponAbilityKind | null = null,
    attackRoll: AttackDieFace[] | null = null,
    saveRoll: SaveDieFace[] | null = null,
  ) {
    super(GameActionKind.Attack, player);
    this.attacker = attacker;
    this.target = target;
    this.weapon = weapon;
    this.selectedAbility = selectedAbility;
    this.attackRoll = attackRoll;
    this.saveRoll = saveRoll;
  }
}

const attackAbility = new AttackAbility();

export const AttackActionProvider: LegalActionProvider = {
  getLegalInstances(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    if (hasUsedCoreAbilityThisActionStep(game, player)) return [];
    return attackAbility.getLegalActions(game, player);
  },
};
