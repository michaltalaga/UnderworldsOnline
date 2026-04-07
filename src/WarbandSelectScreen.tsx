import "./WarbandSelectScreen.css";
import type { WarbandDefinition, WarbandDefinitionId } from "./domain";

type WarbandSelectScreenProps = {
  warbands: readonly WarbandDefinition[];
  onSelect: (warbandId: WarbandDefinitionId) => void;
};

export default function WarbandSelectScreen({ warbands, onSelect }: WarbandSelectScreenProps) {
  return (
    <main className="warband-select-shell">
      <header className="warband-select-hero">
        <h1>Choose your warband</h1>
        <p>Pick a warband to lead into the practice battlefield.</p>
      </header>
      <ul className="warband-select-list">
        {warbands.map((warband) => {
          const leader = warband.fighters.find((fighter) => fighter.isLeader);
          return (
            <li key={warband.id}>
              <button
                type="button"
                className="warband-select-card"
                onClick={() => onSelect(warband.id)}
              >
                <h2>{warband.name}</h2>
                {leader !== undefined && (
                  <p className="warband-select-leader">Led by {leader.name}</p>
                )}
                <dl className="warband-select-stats">
                  <div>
                    <dt>Fighters</dt>
                    <dd>{warband.fighters.length}</dd>
                  </div>
                  <div>
                    <dt>Objectives</dt>
                    <dd>{warband.objectiveCards.length}</dd>
                  </div>
                  <div>
                    <dt>Power cards</dt>
                    <dd>{warband.powerCards.length}</dd>
                  </div>
                </dl>
                <ul className="warband-select-fighter-list">
                  {warband.fighters.map((fighter) => (
                    <li key={fighter.id}>
                      <span className="warband-select-fighter-name">
                        {fighter.name}
                        {fighter.isLeader ? " ★" : ""}
                      </span>
                      <span className="warband-select-fighter-meta">
                        {fighter.move} move · {fighter.health} hp
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
