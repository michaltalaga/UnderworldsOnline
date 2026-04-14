import type { ReactNode } from "react";
import { SetupHero } from "../ui";
import type { Fighter, Game, Player, SetupAction } from "../domain";
import TerritoryRollOffScreen from "./TerritoryRollOffScreen";
import TerritoryChoiceScreen from "./TerritoryChoiceScreen";
import { reactKey } from "../react/reactKey";

type SetupPhasePanelProps = {
  game: Game;
  activePlayer: Player | null;
  applySetupAction: (action: SetupAction) => void;
};

export default function SetupPhasePanel({
  game,
  activePlayer,
  applySetupAction,
}: SetupPhasePanelProps): ReactNode {
  let content: ReactNode = null;

  if (
    game.state.kind === "setupMusterWarbands" ||
    game.state.kind === "setupDrawStartingHands" ||
    game.state.kind === "combatReady"
  ) {
    content = (
      <SetupHero title="Preparing the battlefield..." description="Resolving setup actions." />
    );
  } else if (game.state.kind === "setupMulligan") {
    content = (
      <SetupHero
        badge="Mulligan"
        title="Keep or redraw?"
        description="Set any of your starting hands aside and draw replacements. You only get one mulligan. Use the buttons in the hand dock below."
      />
    );
  } else if (game.state.kind === "setupDetermineTerritoriesRollOff") {
    content = <TerritoryRollOffScreen game={game} onResolve={applySetupAction} />;
  } else if (game.state.kind === "setupDetermineTerritoriesChoice") {
    if (activePlayer !== null) {
      content = <TerritoryChoiceScreen game={game} player={activePlayer} onChoose={applySetupAction} />;
    }
  } else if (game.state.kind === "setupPlaceFeatureTokens") {
    const placementNumber = game.board.featureTokens.length + 1;
    content = (
      <SetupHero
        badge={`${activePlayer?.name ?? "Setup"} placing`}
        title={`Place feature token ${placementNumber} of 5`}
        description="Pick an empty neutral hex on the map. Tokens cannot sit on starting, blocked, stagger, or edge hexes, and must be at least 2 hexes from another token."
      />
    );
  } else if (game.state.kind === "setupDeployFighters") {
    content = <DeploymentPanel player={activePlayer} />;
  }

  return (
    <section className="bg-surface border border-border rounded-panel shadow-panel backdrop-blur-[12px] py-4 px-[18px]">
      {content}
    </section>
  );
}

function DeploymentPanel({
  player,
}: {
  player: Player | null;
}) {
  if (player === null) {
    return null;
  }
  const undeployedFighters = player.getUndeployedFighters();
  const nextFighter: Fighter | null = undeployedFighters[0] ?? null;
  const nextFighterName =
    nextFighter === null
      ? null
      : player.getFighterDefinition(nextFighter.id)?.name ?? nextFighter.id;

  return (
    <>
      <SetupHero
        badge={`${player.name} deploying`}
        title={nextFighterName === null ? "Deployment complete" : `Deploy ${nextFighterName}`}
        description="Place each fighter on a green starting hex inside your territory. Players alternate until every fighter is on the board."
      />
      <aside className="grid gap-3">
        <h3 className="m-0 font-heading text-[1.05rem]">{player.name}&apos;s warband</h3>
        <ul className="list-none m-0 p-0 grid gap-1.5">
          {player.fighters.map((fighter) => {
            const isDeployed = fighter.currentHex !== null;
            const isActive = !isDeployed && fighter.id === nextFighter?.id;
            const baseClass = "flex justify-between gap-3 py-2.5 px-3.5 rounded-[12px] bg-[rgba(244,236,220,0.5)] text-[0.92rem]";
            const activeClass = isActive ? " bg-[rgba(20,136,140,0.18)] border border-[rgba(20,136,140,0.55)]" : "";
            const definition = player.getFighterDefinition(fighter.id);
            return (
              <li key={reactKey(fighter)} className={baseClass + activeClass}>
                <span>{definition?.name ?? fighter.id}</span>
                <span className="text-ink-muted text-[0.82rem]">
                  {isDeployed ? "Deployed" : isActive ? "Next" : "Waiting"}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
