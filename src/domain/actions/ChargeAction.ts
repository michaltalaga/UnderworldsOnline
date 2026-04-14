import type { FighterId, HexId, PlayerId, WeaponDefinitionId } from "../values/ids";
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
import { ChargeAbility } from "../abilities/ChargeAbility";
import { hasUsedCoreAbilityThisActionStep } from "../rules/actionStepQueries";

export class ChargeAction extends GameAction {
  public readonly fighterId: FighterId;
  public readonly path: HexId[];
  public readonly targetId: FighterId;
  public readonly weaponId: WeaponDefinitionId;
  public readonly selectedAbility: WeaponAbilityKind | null;
  public readonly attackRoll: AttackDieFace[] | null;
  public readonly saveRoll: SaveDieFace[] | null;

  public constructor(
    playerId: PlayerId,
    fighterId: FighterId,
    path: HexId[],
    targetId: FighterId,
    weaponId: WeaponDefinitionId,
    selectedAbility: WeaponAbilityKind | null = null,
    attackRoll: AttackDieFace[] | null = null,
    saveRoll: SaveDieFace[] | null = null,
  ) {
    super(GameActionKind.Charge, playerId);
    this.fighterId = fighterId;
    this.path = path;
    this.targetId = targetId;
    this.weaponId = weaponId;
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
