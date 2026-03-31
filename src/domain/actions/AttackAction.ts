import type { FighterId, PlayerId, WeaponDefinitionId } from "../values/ids";
import {
  AttackDieFace,
  GameActionKind,
  SaveDieFace,
  WeaponAbilityKind,
} from "../values/enums";
import { GameAction } from "./GameAction";

export class AttackAction extends GameAction {
  public readonly attackerId: FighterId;
  public readonly targetId: FighterId;
  public readonly weaponId: WeaponDefinitionId;
  public readonly selectedAbility: WeaponAbilityKind | null;
  public readonly attackRoll: AttackDieFace[] | null;
  public readonly saveRoll: SaveDieFace[] | null;

  public constructor(
    playerId: PlayerId,
    attackerId: FighterId,
    targetId: FighterId,
    weaponId: WeaponDefinitionId,
    selectedAbility: WeaponAbilityKind | null = null,
    attackRoll: AttackDieFace[] | null = null,
    saveRoll: SaveDieFace[] | null = null,
  ) {
    super(GameActionKind.Attack, playerId);
    this.attackerId = attackerId;
    this.targetId = targetId;
    this.weaponId = weaponId;
    this.selectedAbility = selectedAbility;
    this.attackRoll = attackRoll;
    this.saveRoll = saveRoll;
  }
}
