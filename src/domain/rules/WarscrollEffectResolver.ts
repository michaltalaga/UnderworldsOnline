import { WarscrollAbilityDefinition } from "../definitions/WarscrollAbilityDefinition";
import { Game } from "../state/Game";
import { Player } from "../state/Player";

export abstract class WarscrollEffectResolver {
  public abstract canResolve(
    game: Game,
    player: Player,
    ability: WarscrollAbilityDefinition,
  ): boolean;

  public abstract resolve(
    game: Game,
    player: Player,
    ability: WarscrollAbilityDefinition,
  ): string[];
}
