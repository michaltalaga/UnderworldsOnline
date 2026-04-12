import { AttackAction } from "../actions/AttackAction";
import { ChargeAction } from "../actions/ChargeAction";
import { DelveAction } from "../actions/DelveAction";
import { FocusAction } from "../actions/FocusAction";
import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import { MoveAction } from "../actions/MoveAction";
import { EndActionStepAction } from "../actions/EndActionStepAction";
import { PassAction } from "../actions/PassAction";
import { GameRecordKind } from "../state/GameRecord";
import { PlayPloyAction } from "../actions/PlayPloyAction";
import { PlayUpgradeAction } from "../actions/PlayUpgradeAction";
import { UseWarscrollAbilityAction } from "../actions/UseWarscrollAbilityAction";
import { Game } from "../state/Game";
import { Fighter } from "../state/Fighter";
import { Player } from "../state/Player";
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

export class CombatActionService extends LegalActionService {
  private readonly warscrollEffectResolver: WarscrollEffectResolver;
  private readonly coreAbilities: readonly Ability[] = [
    new MoveAbility(),
    new AttackAbility(),
    new ChargeAbility(),
    new GuardAbility(),
    new FocusAbility(),
  ];

  public constructor(
    warscrollEffectResolver: WarscrollEffectResolver = new DefaultWarscrollEffectResolver(),
  ) {
    super();
    this.warscrollEffectResolver = warscrollEffectResolver;
  }

  public getLegalActions(game: Game, playerId: PlayerId): GameAction[] {
    if (!game.isInCombatTurn() || game.activePlayerId !== playerId) {
      return [];
    }

    const player = game.getPlayer(playerId);
    if (player === undefined) {
      return [];
    }

    if (game.turnStep === TurnStep.Power) {
      return [
        ...this.getLegalDelveActions(game, player),
        ...this.getLegalPlayPloyActions(game, player),
        ...this.getLegalPlayUpgradeActions(game, player),
        ...this.getLegalUseWarscrollAbilityActions(game, player),
        new PassAction(playerId),
      ];
    }

    if (game.turnStep !== TurnStep.Action) {
      return [];
    }

    if (this.hasUsedCoreAbilityThisActionStep(game, playerId)) {
      return [new EndActionStepAction(playerId)];
    }

    return [
      ...this.coreAbilities.flatMap((ability) => ability.getLegalActions(game, player)),
      ...this.getLegalPlayPloyActions(game, player),
      new PassAction(playerId),
    ];
  }

  // --- Action step validation (delegates to ability classes) ---

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

  // --- Power step validation (stays here — not core abilities) ---

  public isLegalDelveAction(game: Game, action: DelveAction): boolean {
    if (!game.isCombatPowerStep(action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined || player.hasDelvedThisPowerStep) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    if (fighter === undefined || fighter.isSlain || fighter.currentHexId === null) {
      return false;
    }

    const fighterHex = game.getHex(fighter.currentHexId);
    const featureToken = game.getFeatureToken(action.featureTokenId);
    if (fighterHex === undefined || featureToken === undefined) {
      return false;
    }

    return (
      fighterHex.featureTokenId === featureToken.id &&
      featureToken.hexId === fighterHex.id &&
      featureToken.side !== FeatureTokenSide.Hidden
    );
  }

  public isLegalPlayUpgradeAction(game: Game, action: PlayUpgradeAction): boolean {
    if (!game.isCombatPowerStep(action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined) return false;

    const card = player.getCard(action.cardId);
    const fighter = player.getFighter(action.fighterId);
    if (card === undefined || card.kind !== CardKind.Upgrade || fighter === undefined) {
      return false;
    }

    const targets = card.getLegalTargets(game);
    return targets.some((target) =>
      target instanceof Fighter && target.id === fighter.id,
    );
  }

  public isLegalPlayPloyAction(game: Game, action: PlayPloyAction): boolean {
    const player = game.getPlayer(action.playerId);
    if (player === undefined) return false;

    const card = player.getCard(action.cardId);
    if (card === undefined || card.kind !== CardKind.Ploy) return false;

    // The card itself decides when it's playable via getLegalTargets.
    const targets = card.getLegalTargets(game);
    if (action.targetFighterId === null) {
      return targets.some((target) => !(target instanceof Fighter));
    }

    return targets.some((target) =>
      target instanceof Fighter && target.id === action.targetFighterId,
    );
  }

  public isLegalUseWarscrollAbilityAction(game: Game, action: UseWarscrollAbilityAction): boolean {
    if (!game.isCombatPowerStep(action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
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

  // --- Private helpers ---

  private hasUsedCoreAbilityThisActionStep(game: Game, playerId: PlayerId): boolean {
    const coreEventKinds: ReadonlySet<string> = new Set([
      GameRecordKind.Move,
      GameRecordKind.Combat,
      GameRecordKind.Guard,
      GameRecordKind.Focus,
    ]);
    for (let i = game.records.length - 1; i >= 0; i--) {
      const record = game.records[i];
      if (record.kind === GameRecordKind.ActionStepStarted) break;
      if (coreEventKinds.has(record.kind) && record.invokedByPlayerId === playerId) {
        return true;
      }
    }
    return false;
  }

  private getLegalDelveActions(game: Game, player: Player): DelveAction[] {
    if (player.hasDelvedThisPowerStep || !game.isCombatPowerStep(player.id)) {
      return [];
    }

    return player.fighters.flatMap((fighter) => {
      if (fighter.isSlain || fighter.currentHexId === null) return [];
      const fighterHex = game.getFighterHex(fighter);
      if (fighterHex?.featureTokenId === null || fighterHex?.featureTokenId === undefined) return [];
      const featureToken = game.getFeatureToken(fighterHex.featureTokenId);
      if (featureToken === undefined || featureToken.hexId !== fighterHex.id || featureToken.side === FeatureTokenSide.Hidden) {
        return [];
      }
      return [new DelveAction(player.id, fighter.id, featureToken.id)];
    });
  }

  private getLegalPlayUpgradeActions(game: Game, player: Player): PlayUpgradeAction[] {
    if (!game.isCombatPowerStep(player.id)) return [];

    return player.powerHand.flatMap((card) => {
      if (card.kind !== CardKind.Upgrade) return [];
      const targets = card.getLegalTargets(game);
      return targets.flatMap((target) =>
        target instanceof Fighter
          ? [new PlayUpgradeAction(player.id, card.id, target.id)]
          : [],
      );
    });
  }

  private getLegalPlayPloyActions(game: Game, player: Player): PlayPloyAction[] {

    const legalActions = new Map<string, PlayPloyAction>();
    for (const card of player.powerHand) {
      if (card.kind !== CardKind.Ploy) continue;
      const targets = card.getLegalTargets(game);
      for (const target of targets) {
        const targetFighterId = target instanceof Fighter ? target.id : null;
        const action = new PlayPloyAction(player.id, card.id, targetFighterId);
        legalActions.set(`${action.cardId}:${action.targetFighterId ?? ""}`, action);
      }
    }
    return [...legalActions.values()];
  }

  private getLegalUseWarscrollAbilityActions(game: Game, player: Player): UseWarscrollAbilityAction[] {
    const warscrollDefinition = player.getWarscrollDefinition();
    if (warscrollDefinition === undefined || !game.isCombatPowerStep(player.id)) {
      return [];
    }

    return warscrollDefinition.abilities.flatMap((_, abilityIndex) => {
      const action = new UseWarscrollAbilityAction(player.id, abilityIndex);
      return this.isLegalUseWarscrollAbilityAction(game, action) ? [action] : [];
    });
  }

}
