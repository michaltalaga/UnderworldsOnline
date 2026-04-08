import {
  FeatureTokenSide,
  PlaceFeatureTokenAction,
  SetupActionService,
  type Game,
  type HexId,
  type PlayerState,
} from "../domain";
import SetupBoard, { type SetupBoardOccupant } from "./SetupBoard";

type FeaturePlacementScreenProps = {
  game: Game;
  player: PlayerState;
  setupActionService: SetupActionService;
  onPlace: (action: PlaceFeatureTokenAction) => void;
};

export default function FeaturePlacementScreen({
  game,
  player,
  setupActionService,
  onPlace,
}: FeaturePlacementScreenProps) {
  const placementNumber = game.board.featureTokens.length + 1;
  const legalActions = setupActionService.getLegalActions(game);
  const legalHexIds = new Set<HexId>(
    legalActions
      .filter((action): action is PlaceFeatureTokenAction => action instanceof PlaceFeatureTokenAction)
      .map((action) => action.hexId),
  );

  const occupants = new Map<HexId, SetupBoardOccupant>();
  for (const featureToken of game.board.featureTokens) {
    const hidden = featureToken.side === FeatureTokenSide.Hidden;
    occupants.set(featureToken.hexId, {
      kind: "feature",
      label: hidden ? "?" : String(featureToken.value),
      hidden,
    });
  }

  return (
    <main className="setup-shell">
      <header className="setup-hero">
        <span className="setup-active-player">{player.name} placing</span>
        <h1>Place feature token {placementNumber} of 5</h1>
        <p>Pick an empty neutral hex. Tokens cannot sit on starting, blocked, stagger, or edge hexes, and must be at least 2 hexes from another token.</p>
      </header>
      <div className="setup-board-wrapper">
        <SetupBoard
          board={game.board}
          legalHexIds={legalHexIds}
          occupants={occupants}
          onHexClick={(hexId) => onPlace(new PlaceFeatureTokenAction(player.id, hexId))}
        />
      </div>
    </main>
  );
}
