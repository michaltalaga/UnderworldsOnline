import { AttackAction } from "../actions/AttackAction";
import { ChargeAction } from "../actions/ChargeAction";
import { DelveAction } from "../actions/DelveAction";
import { FocusAction } from "../actions/FocusAction";
import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import { MoveAction } from "../actions/MoveAction";
import { PlayPloyAction } from "../actions/PlayPloyAction";
import { PlayUpgradeAction } from "../actions/PlayUpgradeAction";
import { UseWarscrollAbilityAction } from "../actions/UseWarscrollAbilityAction";
import type { LegalActionProvider } from "../actions/LegalActionProvider";
import { Game } from "../state/Game";
import { Fighter } from "../state/Fighter";
import { CardKind, FeatureTokenSide, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import { DefaultWarscrollEffectResolver } from "./DefaultWarscrollEffectResolver";
import { LegalActionService } from "./LegalActionService";
import { WarscrollEffectResolver } from "./WarscrollEffectResolver";
import type { Ability } from "../abilities/Ability";
import { MoveAbility } from "../abilities/MoveAbility";
import { AttackAbility } from "../abilities/AttackAbility";
import { ChargeAbility } from "../abilities/ChargeAbility";
import { GuardAbility } from "../abilities/GuardAbility";
import { FocusAbility } from "../abilities/FocusAbility";

// Action providers (specification pattern)
import { MoveActionProvider } from "../actions/MoveAction";
import { AttackActionProvider } from "../actions/AttackAction";
import { ChargeActionProvider } from "../actions/ChargeAction";
import { GuardActionProvider } from "../actions/GuardAction";
import { FocusActionProvider } from "../actions/FocusAction";
import { PassActionProvider } from "../actions/PassAction";
import { EndActionStepActionProvider } from "../actions/EndActionStepAction";
import { ConfirmCombatActionProvider } from "../actions/ConfirmCombatAction";
import { DelveActionProvider } from "../actions/DelveAction";
import { PlayPloyActionProvider } from "../actions/PlayPloyAction";
import { PlayUpgradeActionProvider } from "../actions/PlayUpgradeAction";
import { UseWarscrollAbilityActionProvider } from "../actions/UseWarscrollAbilityAction";

export class CombatActionService extends LegalActionService {
  private readonly warscrollEffectResolver: WarscrollEffectResolver;
  private readonly coreAbilities: readonly Ability[] = [
    new MoveAbility(),
    new AttackAbility(),
    new ChargeAbility(),
    new GuardAbility(),
    new FocusAbility(),
  ];

  /** All action providers — each knows when its actions are legal. */
  private static readonly providers: readonly LegalActionProvider[] = [
    MoveActionProvider,
    AttackActionProvider,
    ChargeActionProvider,
    GuardActionProvider,
    FocusActionProvider,
    PassActionProvider,
    EndActionStepActionProvider,
    ConfirmCombatActionProvider,
    DelveActionProvider,
    PlayPloyActionProvider,
    PlayUpgradeActionProvider,
    UseWarscrollAbilityActionProvider,
  ];

  public constructor(
    warscrollEffectResolver: WarscrollEffectResolver = new DefaultWarscrollEffectResolver(),
  ) {
    super();
    this.warscrollEffectResolver = warscrollEffectResolver;
  }

  /**
   * Thin aggregator — each provider independently decides what's legal.
   * No central switch, no phase gating. This is the specification pattern.
   */
  public getLegalActions(game: Game, playerId: PlayerId): GameAction[] {
    if (!game.isInCombatTurn() || game.activePlayerId !== playerId) {
      return [];
    }

    const player = game.players.find((p) => p.id === playerId);
    if (player === undefined) {
      return [];
    }

    return CombatActionService.providers.flatMap(p => p.getLegalInstances(game, player));
  }

  // --- Validation methods (engine still calls these) ---

  public isLegalMoveAction(game: Game, action: MoveAction): boolean {
    return this.coreAbilities.some((a) => a.isLegalAction(game, action));
  }

  public isLegalAttackAction(game: Game, action: AttackAction): boolean {
    return this.coreAbilities.some((a) => a.isLegalAction(game, action));
  }

  public isLegalChargeAction(game: Game, action: ChargeAction): boolean {
    return this.coreAbilities.some((a) => a.isLegalAction(game, action));
  }

  public isLegalGuardAction(game: Game, action: GuardAction): boolean {
    return this.coreAbilities.some((a) => a.isLegalAction(game, action));
  }

  public isLegalFocusAction(game: Game, action: FocusAction): boolean {
    return this.coreAbilities.some((a) => a.isLegalAction(game, action));
  }

  public isLegalDelveAction(game: Game, action: DelveAction): boolean {
    if (!game.isCombatPowerStep(action.player.id)) {
      return false;
    }

    const player = action.player;
    if (player === undefined || player.hasDelvedThisPowerStep) {
      return false;
    }

    const fighter = action.fighter;
    if (fighter === undefined || fighter.isSlain || fighter.currentHex === null) {
      return false;
    }

    const fighterHex = fighter.currentHex;
    const featureToken = action.featureToken;
    if (fighterHex === undefined || featureToken === undefined) {
      return false;
    }

    return (
      fighterHex.featureToken === featureToken &&
      featureToken.hex === fighterHex &&
      featureToken.side !== FeatureTokenSide.Hidden
    );
  }

  public isLegalPlayUpgradeAction(game: Game, action: PlayUpgradeAction): boolean {
    if (!game.isCombatPowerStep(action.player.id)) {
      return false;
    }

    const player = action.player;
    if (player === undefined) return false;

    const card = action.card;
    const fighter = action.fighter;
    if (card === undefined || card.kind !== CardKind.Upgrade || fighter === undefined) {
      return false;
    }

    const targets = card.getLegalTargets(game);
    return targets.some((target) => target === fighter);
  }

  public isLegalPlayPloyAction(game: Game, action: PlayPloyAction): boolean {
    const player = action.player;
    if (player === undefined) return false;

    const card = action.card;
    if (card === undefined || card.kind !== CardKind.Ploy) return false;

    // The card itself decides when it's playable via getLegalTargets.
    const targets = card.getLegalTargets(game);
    if (action.targetFighter === null) {
      return targets.some((target) => !(target instanceof Fighter));
    }

    return targets.some((target) => target === action.targetFighter);
  }

  public isLegalUseWarscrollAbilityAction(game: Game, action: UseWarscrollAbilityAction): boolean {
    if (!game.isCombatPowerStep(action.player.id)) {
      return false;
    }

    const player = action.player;
    const warscrollDefinition = player?.getWarscrollDefinition();
    const ability = warscrollDefinition?.getAbility(action.abilityIndex);
    if (player === undefined || warscrollDefinition === undefined || ability === undefined) {
      return false;
    }

    if (ability.timing !== TurnStep.Power) return false;

    return (
      Object.entries(ability.tokenCosts).every(
        ([tokenName, tokenCost]) => player.getWarscrollTokenCount(tokenName) >= tokenCost,
      ) &&
      this.warscrollEffectResolver.canResolve(game, player, ability)
    );
  }

}
