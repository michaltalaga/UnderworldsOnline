import { BoardSide, HexKind, Phase, SetupStep } from "../values/enums";
import type { TerritoryId } from "../values/ids";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { PlayerState } from "../state/PlayerState";
import { ChooseTerritoryAction } from "./ChooseTerritoryAction";
import { CompleteMusterAction } from "./CompleteMusterAction";
import { DeployFighterAction } from "./DeployFighterAction";
import { DrawStartingHandsAction } from "./DrawStartingHandsAction";
import { PlaceFeatureTokenAction } from "./PlaceFeatureTokenAction";
import { ResolveMulliganAction } from "./ResolveMulliganAction";
import { SetupAction } from "./SetupAction";

export class SetupActionService {
  public getLegalActions(game: Game): SetupAction[] {
    if (game.phase !== Phase.Setup || game.setupStep === null) {
      return [];
    }

    switch (game.setupStep) {
      case SetupStep.MusterWarbands:
        return [new CompleteMusterAction()];
      case SetupStep.DrawStartingHands:
        return [new DrawStartingHandsAction()];
      case SetupStep.Mulligan:
        return this.getLegalMulliganActions(game);
      case SetupStep.DetermineTerritories:
        return this.getLegalTerritoryChoiceActions(game);
      case SetupStep.PlaceFeatureTokens:
        return this.getLegalFeaturePlacementActions(game);
      case SetupStep.DeployFighters:
        return this.getLegalDeployActions(game);
      case SetupStep.Complete:
        return [];
      default: {
        const exhaustiveStep: never = game.setupStep;
        throw new Error(`Unsupported setup step ${exhaustiveStep}.`);
      }
    }
  }

  public requiresTerritoryRollOff(game: Game): boolean {
    return (
      game.phase === Phase.Setup &&
      game.setupStep === SetupStep.DetermineTerritories &&
      game.activePlayerId === null
    );
  }

  private getLegalMulliganActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null) {
      return [];
    }

    return [
      new ResolveMulliganAction(player.id, false, false),
      new ResolveMulliganAction(player.id, true, false),
      new ResolveMulliganAction(player.id, false, true),
      new ResolveMulliganAction(player.id, true, true),
    ];
  }

  private getLegalTerritoryChoiceActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null) {
      return [];
    }

    return this.getBoardSides(game).flatMap((boardSide) =>
      game.board.getTerritoriesForSide(boardSide).map(
        (territory) => new ChooseTerritoryAction(player.id, boardSide, territory.id),
      ),
    );
  }

  private getLegalFeaturePlacementActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null) {
      return [];
    }

    return this.getLegalFeaturePlacementHexes(game).map(
      (hex) => new PlaceFeatureTokenAction(player.id, hex.id),
    );
  }

  private getLegalDeployActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null || player.territoryId === null) {
      return [];
    }

    const legalHexes = this.getLegalDeploymentHexes(game, player);
    return player.getUndeployedFighters().flatMap((fighter) =>
      legalHexes.map((hex) => new DeployFighterAction(player.id, fighter.id, hex.id)),
    );
  }

  private getLegalFeaturePlacementHexes(game: Game): HexCell[] {
    const placementNumber = game.board.featureTokens.length + 1;
    if (placementNumber > 5) {
      return [];
    }

    const requireNeutralHex = game.board.featureTokens.length === 0;
    const standardPlacements = game.board.hexes.filter((hex) =>
      this.isLegalFeatureHex(game, hex, false, requireNeutralHex),
    );
    const allowEdgePlacement = standardPlacements.length === 0;

    return game.board.hexes.filter((hex) => {
      if (!this.isLegalFeatureHex(game, hex, allowEdgePlacement, requireNeutralHex)) {
        return false;
      }

      if (placementNumber === 5) {
        return this.wouldSatisfyTerritoryCoverage(game, hex.territoryId);
      }

      return true;
    });
  }

  private getLegalDeploymentHexes(game: Game, player: PlayerState): HexCell[] {
    const territoryId = player.territoryId;
    if (territoryId === null) {
      return [];
    }

    return game.board.hexes.filter(
      (hex) =>
        hex.isStartingHex &&
        hex.territoryId === territoryId &&
        hex.occupantFighterId === null,
    );
  }

  private isLegalFeatureHex(
    game: Game,
    hex: HexCell,
    allowEdgePlacement: boolean,
    requireNeutralHex: boolean,
  ): boolean {
    if (hex.occupantFighterId !== null || hex.featureTokenId !== null) {
      return false;
    }

    if (
      hex.isStartingHex ||
      hex.kind === HexKind.Blocked ||
      hex.kind === HexKind.Stagger
    ) {
      return false;
    }

    if (!allowEdgePlacement && hex.isEdgeHex) {
      return false;
    }

    if (requireNeutralHex && hex.territoryId !== null) {
      return false;
    }

    return !game.board.featureTokens.some((token) => {
      const tokenHex = game.board.getHex(token.hexId);
      return tokenHex !== undefined && this.getHexDistance(hex, tokenHex) <= 2;
    });
  }

  private wouldSatisfyTerritoryCoverage(
    game: Game,
    newTokenTerritoryId: TerritoryId | null,
  ): boolean {
    const occupiedTerritories = new Set<TerritoryId>();

    for (const token of game.board.featureTokens) {
      const tokenHex = game.board.getHex(token.hexId);
      if (tokenHex?.territoryId !== null && tokenHex?.territoryId !== undefined) {
        occupiedTerritories.add(tokenHex.territoryId);
      }
    }

    if (newTokenTerritoryId !== null) {
      occupiedTerritories.add(newTokenTerritoryId);
    }

    return game.players.every(
      (player) => player.territoryId !== null && occupiedTerritories.has(player.territoryId),
    );
  }

  private getHexDistance(a: HexCell, b: HexCell): number {
    const qDistance = a.q - b.q;
    const rDistance = a.r - b.r;
    const sDistance = (a.q + a.r) - (b.q + b.r);
    return (Math.abs(qDistance) + Math.abs(rDistance) + Math.abs(sDistance)) / 2;
  }

  private getActivePlayer(game: Game): PlayerState | null {
    if (game.activePlayerId === null) {
      return null;
    }

    return game.getPlayer(game.activePlayerId) ?? null;
  }

  private getBoardSides(game: Game): BoardSide[] {
    return game.board.getAvailableSides();
  }
}
