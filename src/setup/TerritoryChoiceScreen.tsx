import {
  BoardSide,
  ChooseTerritoryAction,
  type Game,
  type PlayerState,
  type Territory,
} from "../domain";

type TerritoryChoiceScreenProps = {
  game: Game;
  player: PlayerState;
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
    <main className="setup-shell">
      <header className="setup-hero">
        <span className="setup-active-player">{player.name} chooses</span>
        <h1>Pick your territory</h1>
        <p>Choose a board side and the territory you want to defend. Your opponent gets the other side.</p>
      </header>
      <ul className="setup-card-grid">
        {choices.map(({ boardSide, territory }) => (
          <li key={`${boardSide}:${territory.id}`}>
            <button
              type="button"
              className="setup-panel"
              style={{ width: "100%", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}
              onClick={() => onChoose(new ChooseTerritoryAction(player.id, boardSide, territory.id))}
            >
              <h2>{territory.name}</h2>
              <p className="setup-panel-meta">
                {boardSide === BoardSide.Front ? "Front side" : "Back side"} · {territory.hexIds.length} hexes
              </p>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
