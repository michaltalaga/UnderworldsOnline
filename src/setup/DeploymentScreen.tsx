import {
  DeployFighterAction,
  FeatureTokenSide,
  SetupActionService,
  type FighterState,
  type Game,
  type HexId,
  type PlayerState,
} from "../domain";
import SetupBoard, { type SetupBoardOccupant } from "./SetupBoard";

type DeploymentScreenProps = {
  game: Game;
  player: PlayerState;
  setupActionService: SetupActionService;
  onDeploy: (action: DeployFighterAction) => void;
};

export default function DeploymentScreen({
  game,
  player,
  setupActionService,
  onDeploy,
}: DeploymentScreenProps) {
  const undeployedFighters = player.getUndeployedFighters();
  const nextFighter: FighterState | null = undeployedFighters[0] ?? null;
  const legalActions = setupActionService.getLegalActions(game);
  const legalDeploys = legalActions.filter(
    (action): action is DeployFighterAction => action instanceof DeployFighterAction,
  );
  const legalHexIds =
    nextFighter === null
      ? new Set<HexId>()
      : new Set<HexId>(
          legalDeploys
            .filter((action) => action.fighterId === nextFighter.id)
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
  for (const gamePlayer of game.players) {
    const playerSlot = gamePlayer.id === game.players[0]?.id ? "player-one" : "player-two";
    for (const fighter of gamePlayer.fighters) {
      if (fighter.currentHexId === null) {
        continue;
      }
      const definition = gamePlayer.getFighterDefinition(fighter.id);
      occupants.set(fighter.currentHexId, {
        kind: "fighter",
        label: getFighterInitials(definition?.name ?? fighter.id),
        playerSlot,
      });
    }
  }

  return (
    <main className="setup-shell">
      <header className="setup-hero">
        <span className="setup-active-player">{player.name} deploying</span>
        <h1>{nextFighter !== null ? `Deploy ${getFighterDisplayName(player, nextFighter)}` : "Deployment complete"}</h1>
        <p>Place each fighter on a starting hex inside your territory. Players alternate until every fighter is on the board.</p>
      </header>
      <div className="setup-deploy-layout">
        <div className="setup-board-wrapper">
          <SetupBoard
            board={game.board}
            legalHexIds={legalHexIds}
            occupants={occupants}
            onHexClick={(hexId) => {
              if (nextFighter === null) {
                return;
              }
              onDeploy(new DeployFighterAction(player.id, nextFighter.id, hexId));
            }}
          />
        </div>
        <aside className="setup-deploy-sidebar">
          <h3>{player.name}'s warband</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {player.fighters.map((fighter) => {
              const isDeployed = fighter.currentHexId !== null;
              const isActive = !isDeployed && fighter.id === nextFighter?.id;
              const className = `setup-deploy-fighter${isActive ? " setup-deploy-fighter-active" : ""}`;
              const definition = player.getFighterDefinition(fighter.id);
              return (
                <li key={fighter.id} className={className}>
                  <span>{definition?.name ?? fighter.id}</span>
                  <span className="setup-card-meta">
                    {isDeployed ? "Deployed" : isActive ? "Next" : "Waiting"}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
}

function getFighterDisplayName(player: PlayerState, fighter: FighterState): string {
  return player.getFighterDefinition(fighter.id)?.name ?? fighter.id;
}

function getFighterInitials(name: string): string {
  const parts = name.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
