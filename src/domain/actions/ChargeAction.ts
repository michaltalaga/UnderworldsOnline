import type { FighterId, HexId, PlayerId, WeaponDefinitionId } from "../values/ids";
import { GameActionKind, WeaponAbilityKind } from "../values/enums";
import { GameAction } from "./GameAction";

export class ChargeAction extends GameAction {
  public readonly fighterId: FighterId;
  public readonly path: HexId[];
  public readonly targetId: FighterId;
  public readonly weaponId: WeaponDefinitionId;
  public readonly selectedAbility: WeaponAbilityKind | null;

  public constructor(
    playerId: PlayerId,
    fighterId: FighterId,
    path: HexId[],
    targetId: FighterId,
    weaponId: WeaponDefinitionId,
    selectedAbility: WeaponAbilityKind | null = null,
  ) {
    super(GameActionKind.Charge, playerId);
    this.fighterId = fighterId;
    this.path = path;
    this.targetId = targetId;
    this.weaponId = weaponId;
    this.selectedAbility = selectedAbility;
  }
}
