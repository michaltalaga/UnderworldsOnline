import {
  BoardSide,
  ChooseTerritoryAction,
  type Game,
  type Player,
  type Territory,
} from "../domain";
import { PanelButton, SetupHero } from "../ui";

type TerritoryChoiceScreenProps = {
  game: Game;
  player: Player;
  onChoose: (action: ChooseTerritoryAction) => void;
};

type TerritoryChoice = {
  boardSide: BoardSide;
  territory: Territory;
};

export default function TerritoryChoiceScreen({
  game,
  player,
  onChoose,
}: TerritoryChoiceScreenProps) {
  const choices: TerritoryChoice[] = game.board
    .getAvailableSides()
    .flatMap((boardSide) =>
      game.board
        .getTerritoriesForSide(boardSide)
        .map((territory) => ({ boardSide, territory })),
    );

  return (
    <>
      <SetupHero
        badge={`${player.name} chooses`}
        title="Pick your territory"
        description="Choose a board side and the territory you want to defend. Your opponent gets the other side."
      />
      <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        {choices.map(({ boardSide, territory }) => (
          <li key={`${boardSide}:${territory.id}`}>
            <PanelButton
              className="!rounded-[22px] !p-[22px] !gap-3.5"
              onClick={() => onChoose(new ChooseTerritoryAction(player, boardSide, territory))}
            >
              <h2 className="m-0 font-heading text-[1.35rem]">{territory.name}</h2>
              <p className="m-0 text-ink-muted text-[0.92rem] italic">
                {boardSide === BoardSide.Front ? "Front side" : "Back side"} · {territory.hexIds.length} hexes
              </p>
            </PanelButton>
          </li>
        ))}
      </ul>
    </>
  );
}
