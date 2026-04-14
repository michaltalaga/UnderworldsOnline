import { BoardSide, HexKind, Phase } from "../values/enums";
import type { TerritoryId } from "../values/ids";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { Player } from "../state/Player";
import { ChooseTerritoryAction } from "./ChooseTerritoryAction";
import { CompleteMusterAction } from "./CompleteMusterAction";
import { DeployFighterAction } from "./DeployFighterAction";
import { DrawStartingHandsAction } from "./DrawStartingHandsAction";
import { PlaceFeatureTokenAction } from "./PlaceFeatureTokenAction";
import { ResolveMulliganAction } from "./ResolveMulliganAction";
import { SetupAction } from "./SetupAction";

export class SetupActionService {
  public getLegalActions(game: Game): SetupAction[] {
    const state = game.state;
    if (state.phase !== Phase.Setup) {
      return [];
    }

    switch (state.kind) {
      case "setupMusterWarbands":
        return [new CompleteMusterAction()];
      case "setupDrawStartingHands":
        return [new DrawStartingHandsAction()];
      case "setupMulligan":
        return this.getLegalMulliganActions(game);
      case "setupDetermineTerritoriesRollOff":
        return [];
      case "setupDetermineTerritoriesChoice":
        return this.getLegalTerritoryChoiceActions(game);
      case "setupPlaceFeatureTokens":
        return this.getLegalFeaturePlacementActions(game);
      case "setupDeployFighters":
        return this.getLegalDeployActions(game);
      default: {
        const exhaustiveState: never = state;
        throw new Error(`Unsupported setup game state ${String(exhaustiveState)}.`);
      }
    }
  }

  public requiresTerritoryRollOff(game: Game): boolean {
    return game.state.kind === "setupDetermineTerritoriesRollOff";
  }

  private getLegalMulliganActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null) {
      return [];
    }

    return [
      new ResolveMulliganAction(player, false, false),
      new ResolveMulliganAction(player, true, false),
      new ResolveMulliganAction(player, false, true),
      new ResolveMulliganAction(player, true, true),
    ];
  }

  private getLegalTerritoryChoiceActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null) {
      return [];
    }

    return this.getBoardSides(game).flatMap((boardSide) =>
      game.board.getTerritoriesForSide(boardSide).map(
        (territory) => new ChooseTerritoryAction(player, boardSide, territory),
      ),
    );
  }

  private getLegalFeaturePlacementActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null) {
      return [];
    }

    return this.getLegalFeaturePlacementHexes(game).map(
      (hex) => new PlaceFeatureTokenAction(player, hex),
    );
  }

  private getLegalDeployActions(game: Game): SetupAction[] {
    const player = this.getActivePlayer(game);
    if (player === null || player.territory === null) {
      return [];
    }

    const legalHexes = this.getLegalDeploymentHexes(game, player);
    return player.getUndeployedFighters().flatMap((fighter) =>
      legalHexes.map((hex) => new DeployFighterAction(player, fighter, hex)),
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
        return this.wouldSatisfyTerritoryCoverage(game, hex.territory?.id ?? null);
      }

      return true;
    });
  }

  private getLegalDeploymentHexes(game: Game, player: Player): HexCell[] {
    const territory = player.territory;
    if (territory === null) {
      return [];
    }

    return game.board.hexes.filter(
      (hex) =>
        hex.isStartingHex &&
        hex.territory === territory &&
        hex.occupantFighter === null,
    );
  }

  private isLegalFeatureHex(
    game: Game,
    hex: HexCell,
    allowEdgePlacement: boolean,
    requireNeutralHex: boolean,
  ): boolean {
    if (hex.occupantFighter !== null || hex.featureToken !== null) {
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

    if (requireNeutralHex && hex.territory !== null) {
      return false;
    }

    return !game.board.featureTokens.some((token) => {
      return this.getHexDistance(hex, token.hex) <= 2;
    });
  }

  private wouldSatisfyTerritoryCoverage(
    game: Game,
    newTokenTerritoryId: TerritoryId | null,
  ): boolean {
    const occupiedTerritories = new Set<TerritoryId>();

    for (const token of game.board.featureTokens) {
      const territoryId = token.hex.territory?.id;
      if (territoryId !== undefined) {
        occupiedTerritories.add(territoryId);
      }
    }

    if (newTokenTerritoryId !== null) {
      occupiedTerritories.add(newTokenTerritoryId);
    }

    return game.players.every(
      (player) => player.territory !== null && occupiedTerritories.has(player.territory.id),
    );
  }

  private getHexDistance(a: HexCell, b: HexCell): number {
    const qDistance = a.q - b.q;
    const rDistance = a.r - b.r;
    const sDistance = (a.q + a.r) - (b.q + b.r);
    return (Math.abs(qDistance) + Math.abs(rDistance) + Math.abs(sDistance)) / 2;
  }

  private getActivePlayer(game: Game): Player | null {
    if (game.activePlayer === null) {
      return null;
    }

    return game.activePlayer;
  }

  private getBoardSides(game: Game): BoardSide[] {
    return game.board.getAvailableSides();
  }
}
