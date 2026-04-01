import { WarscrollAbilityDefinition } from "../definitions/WarscrollAbilityDefinition";
import { Game } from "../state/Game";
import { PlayerState } from "../state/PlayerState";

export abstract class WarscrollEffectResolver {
  public abstract canResolve(
    game: Game,
    player: PlayerState,
    ability: WarscrollAbilityDefinition,
  ): boolean;

  public abstract resolve(
    game: Game,
    player: PlayerState,
    ability: WarscrollAbilityDefinition,
  ): string[];
}
