import { useMemo } from "react";
import {
  AttackDieFace,
  ResolveTerritoryRollOffAction,
  type Game,
} from "../domain";

type TerritoryRollOffScreenProps = {
  game: Game;
  onResolve: (action: ResolveTerritoryRollOffAction) => void;
};

type GeneratedRoll = {
  rounds: { firstFace: AttackDieFace; secondFace: AttackDieFace }[];
  winnerIndex: 0 | 1;
};

export default function TerritoryRollOffScreen({ game, onResolve }: TerritoryRollOffScreenProps) {
  const playerOne = game.players[0];
  const playerTwo = game.players[1];

  const generated = useMemo<GeneratedRoll>(() => generateRollOff(), [game.id]);
  const finalRound = generated.rounds[generated.rounds.length - 1];
  const winnerName =
    generated.winnerIndex === 0 ? playerOne?.name ?? "Player One" : playerTwo?.name ?? "Player Two";
  const loserName =
    generated.winnerIndex === 0 ? playerTwo?.name ?? "Player Two" : playerOne?.name ?? "Player One";

  return (
    <main className="setup-shell">
      <header className="setup-hero">
        <span className="setup-active-player">Territory roll-off</span>
        <h1>Roll for first pick</h1>
        <p>Both players roll an attack die. The winner picks the board side and territory; the loser places the first feature token.</p>
      </header>
      <section className="setup-rolloff">
        <div className="setup-rolloff-dice">
          <div className="setup-die">
            <span className="setup-die-player">{playerOne?.name ?? "Player One"}</span>
            <span className="setup-die-face">{formatDieFace(finalRound.firstFace)}</span>
            {generated.winnerIndex === 0 && <span className="setup-die-winner">Winner</span>}
          </div>
          <div className="setup-die">
            <span className="setup-die-player">{playerTwo?.name ?? "Player Two"}</span>
            <span className="setup-die-face">{formatDieFace(finalRound.secondFace)}</span>
            {generated.winnerIndex === 1 && <span className="setup-die-winner">Winner</span>}
          </div>
        </div>
        {generated.rounds.length > 1 && (
          <p className="setup-rolloff-summary">
            Re-rolled {generated.rounds.length - 1} tied round{generated.rounds.length - 1 === 1 ? "" : "s"}.
          </p>
        )}
        <p className="setup-rolloff-summary">
          {winnerName} wins the roll-off and will choose a territory. {loserName} will place the first feature token.
        </p>
        <button
          type="button"
          className="setup-button setup-button-primary"
          onClick={() => onResolve(new ResolveTerritoryRollOffAction(generated.rounds))}
        >
          Continue
        </button>
      </section>
    </main>
  );
}

const decisiveFaces: AttackDieFace[] = [
  AttackDieFace.Critical,
  AttackDieFace.Hammer,
  AttackDieFace.Sword,
  AttackDieFace.Support,
  AttackDieFace.Blank,
];

function rollDie(): AttackDieFace {
  return decisiveFaces[Math.floor(Math.random() * decisiveFaces.length)];
}

function getFaceRank(face: AttackDieFace): number {
  switch (face) {
    case AttackDieFace.Critical:
      return 3;
    case AttackDieFace.Hammer:
    case AttackDieFace.Sword:
      return 2;
    case AttackDieFace.Support:
    case AttackDieFace.DoubleSupport:
      return 1;
    case AttackDieFace.Blank:
      return 0;
    default:
      return 0;
  }
}

function generateRollOff(): GeneratedRoll {
  const rounds: { firstFace: AttackDieFace; secondFace: AttackDieFace }[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const firstFace = rollDie();
    const secondFace = rollDie();
    rounds.push({ firstFace, secondFace });

    const comparison = getFaceRank(firstFace) - getFaceRank(secondFace);
    if (comparison > 0) {
      return { rounds, winnerIndex: 0 };
    }
    if (comparison < 0) {
      return { rounds, winnerIndex: 1 };
    }
  }

  // Fallback: force a decisive round to satisfy the resolver.
  rounds.push({ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank });
  return { rounds, winnerIndex: 0 };
}

function formatDieFace(face: AttackDieFace): string {
  switch (face) {
    case AttackDieFace.Critical:
      return "Critical";
    case AttackDieFace.Hammer:
      return "Hammer";
    case AttackDieFace.Sword:
      return "Sword";
    case AttackDieFace.Support:
      return "Support";
    case AttackDieFace.DoubleSupport:
      return "Double Support";
    case AttackDieFace.Blank:
      return "Blank";
    default:
      return face;
  }
}
