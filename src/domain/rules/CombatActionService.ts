import { AttackAction } from "../actions/AttackAction";
import { ChargeAction } from "../actions/ChargeAction";
import { DelveAction } from "../actions/DelveAction";
import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import { MoveAction } from "../actions/MoveAction";
import { PassAction } from "../actions/PassAction";
import { PlayUpgradeAction } from "../actions/PlayUpgradeAction";
import { UseWarscrollAbilityAction } from "../actions/UseWarscrollAbilityAction";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { FighterState } from "../state/FighterState";
import { PlayerState } from "../state/PlayerState";
import { CardKind, CardZone, FeatureTokenSide, HexKind, TurnStep } from "../values/enums";
import type { FighterId, HexId, PlayerId } from "../values/ids";
import { DefaultWarscrollEffectResolver } from "./DefaultWarscrollEffectResolver";
import { LegalActionService } from "./LegalActionService";
import { WarscrollEffectResolver } from "./WarscrollEffectResolver";

const neighborDirections = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
] as const;

type MovePathSearchNode = {
  hex: HexCell;
  path: HexId[];
};

export class CombatActionService extends LegalActionService {
  private readonly warscrollEffectResolver: WarscrollEffectResolver;

  public constructor(
    warscrollEffectResolver: WarscrollEffectResolver = new DefaultWarscrollEffectResolver(),
  ) {
    super();
    this.warscrollEffectResolver = warscrollEffectResolver;
  }

  public getLegalActions(game: Game, playerId: PlayerId): GameAction[] {
    if (game.state.kind !== "combatTurn" || game.activePlayerId !== playerId) {
      return [];
    }

    const player = game.getPlayer(playerId);
    if (player === undefined) {
      return [];
    }

    if (game.turnStep === TurnStep.Power) {
      return [
        ...this.getLegalDelveActions(game, player),
        ...this.getLegalPlayUpgradeActions(game, player),
        ...this.getLegalUseWarscrollAbilityActions(game, player),
        new PassAction(playerId),
      ];
    }

    if (game.turnStep !== TurnStep.Action) {
      return [];
    }

    return [
      ...player.fighters.flatMap((fighter) => this.getLegalMoveActionsForFighter(game, player, fighter.id)),
      ...player.fighters.flatMap((fighter) => this.getLegalChargeActionsForFighter(game, player, fighter.id)),
      ...player.fighters.flatMap((fighter) => this.getLegalAttackActionsForFighter(game, player, fighter.id)),
      ...player.fighters.flatMap((fighter) => this.getLegalGuardActionsForFighter(game, player, fighter.id)),
      new PassAction(playerId),
    ];
  }

  public isLegalChargeAction(game: Game, action: ChargeAction): boolean {
    if (!this.isCombatActionStep(game, action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    const opponent = game.getOpponent(action.playerId);
    if (player === undefined || opponent === undefined) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    const fighterDefinition = player.getFighterDefinition(action.fighterId);
    const target = opponent.getFighter(action.targetId);
    if (
      fighter === undefined ||
      fighterDefinition === undefined ||
      target === undefined ||
      target.isSlain ||
      target.currentHexId === null
    ) {
      return false;
    }

    if (
      !this.isLegalMoveAction(game, new MoveAction(action.playerId, action.fighterId, action.path))
      || action.path.length === 0
    ) {
      return false;
    }

    const weapon = player.getFighterWeaponDefinition(action.fighterId, action.weaponId);
    if (weapon === undefined) {
      return false;
    }

    if (
      action.selectedAbility !== null &&
      !weapon.hasAbility(action.selectedAbility)
    ) {
      return false;
    }

    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) {
      return false;
    }

    const destinationHex = game.board.getHex(destinationHexId);
    const targetHex = game.board.getHex(target.currentHexId);
    if (destinationHex === undefined || targetHex === undefined) {
      return false;
    }

    return this.getHexDistance(destinationHex, targetHex) <= weapon.range;
  }

  public isLegalAttackAction(game: Game, action: AttackAction): boolean {
    if (!this.isCombatActionStep(game, action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    const opponent = game.getOpponent(action.playerId);
    if (player === undefined || opponent === undefined) {
      return false;
    }

    const attacker = player.getFighter(action.attackerId);
    const attackerDefinition = player.getFighterDefinition(action.attackerId);
    const target = opponent.getFighter(action.targetId);
    if (
      attacker === undefined ||
      attackerDefinition === undefined ||
      target === undefined ||
      !this.canFighterAttack(attacker) ||
      target.isSlain ||
      target.currentHexId === null
    ) {
      return false;
    }

    const weapon = player.getFighterWeaponDefinition(action.attackerId, action.weaponId);
    if (weapon === undefined) {
      return false;
    }

    if (
      action.selectedAbility !== null &&
      !weapon.hasAbility(action.selectedAbility)
    ) {
      return false;
    }

    const attackerHexId = attacker.currentHexId;
    if (attackerHexId === null) {
      return false;
    }

    const attackerHex = game.board.getHex(attackerHexId);
    const targetHex = game.board.getHex(target.currentHexId);
    if (attackerHex === undefined || targetHex === undefined) {
      return false;
    }

    return this.getHexDistance(attackerHex, targetHex) <= weapon.range;
  }

  public isLegalGuardAction(game: Game, action: GuardAction): boolean {
    if (!this.isCombatActionStep(game, action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    if (fighter === undefined) {
      return false;
    }

    return this.canFighterGuard(fighter);
  }

  public isLegalDelveAction(game: Game, action: DelveAction): boolean {
    if (!this.isCombatTurnStep(game, action.playerId, TurnStep.Power)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined || player.hasDelvedThisPowerStep) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    if (
      fighter === undefined ||
      fighter.isSlain ||
      fighter.currentHexId === null
    ) {
      return false;
    }

    const fighterHex = game.board.getHex(fighter.currentHexId);
    const featureToken = game.board.getFeatureToken(action.featureTokenId);
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
    if (!this.isCombatTurnStep(game, action.playerId, TurnStep.Power)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined) {
      return false;
    }

    const cardWithDefinition = player.getCardWithDefinition(action.cardId);
    const fighter = player.getFighter(action.fighterId);
    if (cardWithDefinition === undefined || fighter === undefined) {
      return false;
    }

    return (
      cardWithDefinition.definition.kind === CardKind.Upgrade &&
      cardWithDefinition.card.zone === CardZone.PowerHand &&
      player.glory >= cardWithDefinition.definition.gloryValue &&
      !fighter.isSlain &&
      fighter.currentHexId !== null
    );
  }

  public isLegalUseWarscrollAbilityAction(game: Game, action: UseWarscrollAbilityAction): boolean {
    if (!this.isCombatTurnStep(game, action.playerId, TurnStep.Power)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    const warscrollDefinition = player?.getWarscrollDefinition();
    const ability = warscrollDefinition?.getAbility(action.abilityIndex);
    if (player === undefined || warscrollDefinition === undefined || ability === undefined) {
      return false;
    }

    if (ability.timing !== TurnStep.Power) {
      return false;
    }

    return (
      Object.entries(ability.tokenCosts).every(
        ([tokenName, tokenCost]) => (player.warscrollState.tokens[tokenName] ?? 0) >= tokenCost,
      ) &&
      this.warscrollEffectResolver.canResolve(game, player, ability)
    );
  }

  public isLegalMoveAction(game: Game, action: MoveAction): boolean {
    if (!this.isCombatActionStep(game, action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    const fighterDefinition = player.getFighterDefinition(action.fighterId);
    if (fighter === undefined || fighterDefinition === undefined) {
      return false;
    }

    if (
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasMoveToken ||
      fighter.hasChargeToken
    ) {
      return false;
    }

    if (action.path.length === 0 || action.path.length > fighterDefinition.move) {
      return false;
    }

    const visitedHexIds = new Set<HexId>([fighter.currentHexId]);
    let currentHex = game.board.getHex(fighter.currentHexId);
    if (currentHex === undefined) {
      return false;
    }

    for (const nextHexId of action.path) {
      if (visitedHexIds.has(nextHexId)) {
        return false;
      }

      const nextHex = game.board.getHex(nextHexId);
      if (nextHex === undefined || !this.isAdjacent(currentHex, nextHex)) {
        return false;
      }

      if (!this.isTraversableMoveHex(nextHex)) {
        return false;
      }

      visitedHexIds.add(nextHex.id);
      currentHex = nextHex;
    }

    return true;
  }

  private getLegalAttackActionsForFighter(
    game: Game,
    player: PlayerState,
    fighterId: FighterId,
  ): AttackAction[] {
    const fighter = player.getFighter(fighterId);
    const fighterDefinition = player.getFighterDefinition(fighterId);
    if (
      fighter === undefined ||
      fighterDefinition === undefined ||
      !this.canFighterAttack(fighter) ||
      !this.isCombatActionStep(game, player.id)
    ) {
      return [];
    }

    const opponent = game.getOpponent(player.id);
    if (opponent === undefined) {
      return [];
    }

    const attackerHexId = fighter.currentHexId;
    if (attackerHexId === null) {
      return [];
    }

    const attackerHex = game.board.getHex(attackerHexId);
    if (attackerHex === undefined) {
      return [];
    }

    return fighterDefinition.weapons.flatMap((weapon) =>
      opponent.fighters.flatMap((target) => {
        if (target.isSlain || target.currentHexId === null) {
          return [];
        }

        const targetHex = game.board.getHex(target.currentHexId);
        if (targetHex === undefined || this.getHexDistance(attackerHex, targetHex) > weapon.range) {
          return [];
        }

        const abilityActions = weapon.abilities.map(
          (ability) => new AttackAction(player.id, fighter.id, target.id, weapon.id, ability.kind),
        );

        return [
          new AttackAction(player.id, fighter.id, target.id, weapon.id),
          ...abilityActions,
        ];
      }),
    );
  }

  private getLegalChargeActionsForFighter(
    game: Game,
    player: PlayerState,
    fighterId: FighterId,
  ): ChargeAction[] {
    const fighter = player.getFighter(fighterId);
    const fighterDefinition = player.getFighterDefinition(fighterId);
    if (
      fighter === undefined ||
      fighterDefinition === undefined ||
      !this.isCombatActionStep(game, player.id)
    ) {
      return [];
    }

    const opponent = game.getOpponent(player.id);
    if (opponent === undefined) {
      return [];
    }

    return this.getLegalMoveActionsForFighter(game, player, fighterId).flatMap((moveAction) => {
      const destinationHexId = moveAction.path[moveAction.path.length - 1];
      if (destinationHexId === undefined) {
        return [];
      }

      const destinationHex = game.board.getHex(destinationHexId);
      if (destinationHex === undefined) {
        return [];
      }

      return fighterDefinition.weapons.flatMap((weapon) =>
        opponent.fighters.flatMap((target) => {
          if (target.isSlain || target.currentHexId === null) {
            return [];
          }

          const targetHex = game.board.getHex(target.currentHexId);
          if (targetHex === undefined || this.getHexDistance(destinationHex, targetHex) > weapon.range) {
            return [];
          }

          const abilityActions = weapon.abilities.map(
            (ability) => new ChargeAction(player.id, fighter.id, moveAction.path, target.id, weapon.id, ability.kind),
          );

          return [
            new ChargeAction(player.id, fighter.id, moveAction.path, target.id, weapon.id),
            ...abilityActions,
          ];
        }),
      );
    });
  }

  private getLegalGuardActionsForFighter(
    game: Game,
    player: PlayerState,
    fighterId: FighterId,
  ): GuardAction[] {
    const fighter = player.getFighter(fighterId);
    if (fighter === undefined || !this.canFighterGuard(fighter)) {
      return [];
    }

    if (!this.isCombatActionStep(game, player.id)) {
      return [];
    }

    return [new GuardAction(player.id, fighter.id)];
  }

  private getLegalDelveActions(
    game: Game,
    player: PlayerState,
  ): DelveAction[] {
    if (
      player.hasDelvedThisPowerStep ||
      !this.isCombatTurnStep(game, player.id, TurnStep.Power)
    ) {
      return [];
    }

    return player.fighters.flatMap((fighter) => {
      if (fighter.isSlain || fighter.currentHexId === null) {
        return [];
      }

      const fighterHex = game.board.getHex(fighter.currentHexId);
      if (fighterHex?.featureTokenId === null || fighterHex?.featureTokenId === undefined) {
        return [];
      }

      const featureToken = game.board.getFeatureToken(fighterHex.featureTokenId);
      if (
        featureToken === undefined ||
        featureToken.hexId !== fighterHex.id ||
        featureToken.side === FeatureTokenSide.Hidden
      ) {
        return [];
      }

      return [new DelveAction(player.id, fighter.id, featureToken.id)];
    });
  }

  private getLegalPlayUpgradeActions(
    game: Game,
    player: PlayerState,
  ): PlayUpgradeAction[] {
    if (!this.isCombatTurnStep(game, player.id, TurnStep.Power)) {
      return [];
    }

    const upgradeCards = player.powerHand.filter((card) => {
      const definition = player.getCardDefinition(card.id);
      return (
        definition?.kind === CardKind.Upgrade &&
        player.glory >= definition.gloryValue
      );
    });

    return upgradeCards.flatMap((card) =>
      player.fighters.flatMap((fighter) =>
        !fighter.isSlain && fighter.currentHexId !== null
          ? [new PlayUpgradeAction(player.id, card.id, fighter.id)]
          : []
      ),
    );
  }

  private getLegalUseWarscrollAbilityActions(
    game: Game,
    player: PlayerState,
  ): UseWarscrollAbilityAction[] {
    const warscrollDefinition = player.getWarscrollDefinition();
    if (
      warscrollDefinition === undefined ||
      !this.isCombatTurnStep(game, player.id, TurnStep.Power)
    ) {
      return [];
    }

    return warscrollDefinition.abilities.flatMap((_, abilityIndex) => {
      const action = new UseWarscrollAbilityAction(player.id, abilityIndex);
      return this.isLegalUseWarscrollAbilityAction(game, action) ? [action] : [];
    });
  }

  private getLegalMoveActionsForFighter(
    game: Game,
    player: PlayerState,
    fighterId: FighterId,
  ): MoveAction[] {
    const fighter = player.getFighter(fighterId);
    const fighterDefinition = player.getFighterDefinition(fighterId);
    if (fighter === undefined || fighterDefinition === undefined) {
      return [];
    }

    if (
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasMoveToken ||
      fighter.hasChargeToken
    ) {
      return [];
    }

    const startHex = game.board.getHex(fighter.currentHexId);
    if (startHex === undefined) {
      return [];
    }

    const legalActions: MoveAction[] = [];
    const frontier: MovePathSearchNode[] = [{ hex: startHex, path: [] }];
    const shortestPathLengths = new Map<HexId, number>([[startHex.id, 0]]);

    while (frontier.length > 0) {
      const currentNode = frontier.shift();
      if (currentNode === undefined || currentNode.path.length >= fighterDefinition.move) {
        continue;
      }

      for (const neighborHex of this.getAdjacentHexes(game, currentNode.hex)) {
        if (!this.isTraversableMoveHex(neighborHex)) {
          continue;
        }

        const nextPathLength = currentNode.path.length + 1;
        const bestKnownPathLength = shortestPathLengths.get(neighborHex.id);
        if (
          bestKnownPathLength !== undefined &&
          bestKnownPathLength <= nextPathLength
        ) {
          continue;
        }

        const nextPath = [...currentNode.path, neighborHex.id];
        shortestPathLengths.set(neighborHex.id, nextPathLength);
        legalActions.push(new MoveAction(player.id, fighter.id, nextPath));
        frontier.push({ hex: neighborHex, path: nextPath });
      }
    }

    return legalActions;
  }

  private canFighterGuard(fighter: FighterState): boolean {
    return !(
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasMoveToken ||
      fighter.hasChargeToken ||
      fighter.hasGuardToken
    );
  }

  private canFighterAttack(fighter: FighterState): boolean {
    return !(
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasChargeToken
    );
  }

  private isCombatActionStep(game: Game, playerId: PlayerId): boolean {
    return this.isCombatTurnStep(game, playerId, TurnStep.Action);
  }

  private isCombatTurnStep(game: Game, playerId: PlayerId, turnStep: TurnStep): boolean {
    return (
      game.state.kind === "combatTurn" &&
      game.turnStep === turnStep &&
      game.activePlayerId === playerId
    );
  }

  private getAdjacentHexes(game: Game, hex: HexCell): HexCell[] {
    return neighborDirections.flatMap(([qOffset, rOffset]) => {
      const adjacentHex = game.board.hexes.find(
        (candidate) => candidate.q === hex.q + qOffset && candidate.r === hex.r + rOffset,
      );

      return adjacentHex === undefined ? [] : [adjacentHex];
    });
  }

  private isAdjacent(a: HexCell, b: HexCell): boolean {
    return neighborDirections.some(
      ([qOffset, rOffset]) => a.q + qOffset === b.q && a.r + rOffset === b.r,
    );
  }

  private getHexDistance(a: HexCell, b: HexCell): number {
    const qDistance = a.q - b.q;
    const rDistance = a.r - b.r;
    const sDistance = (a.q + a.r) - (b.q + b.r);
    return (Math.abs(qDistance) + Math.abs(rDistance) + Math.abs(sDistance)) / 2;
  }

  private isTraversableMoveHex(hex: HexCell): boolean {
    return hex.kind !== HexKind.Blocked && hex.occupantFighterId === null;
  }
}
