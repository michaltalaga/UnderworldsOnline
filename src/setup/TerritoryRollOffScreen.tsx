import { useMemo } from "react";
import {
  AttackDieFace,
  deterministicFirstPlayerRollOff,
  getAttackDieFaceRank,
  ResolveTerritoryRollOffAction,
  rollAttackDie,
  type Game,
} from "../domain";

// Shows the continue button for the territory roll-off phase. The dice
// themselves are rendered by the DiceTray (docked inside the map panel)
// once the engine applies the action — here we just generate random
// rounds, pass them to the engine, and let the tray surface the result.
type TerritoryRollOffScreenProps = {
  game: Game;
  onResolve: (action: ResolveTerritoryRollOffAction) => void;
};

type GeneratedRoll = {
  rounds: { firstFace: AttackDieFace; secondFace: AttackDieFace }[];
};

export default function TerritoryRollOffScreen({ game, onResolve }: TerritoryRollOffScreenProps) {
  const generated = useMemo<GeneratedRoll>(() => generateRollOff(), [game.id]);

  return (
    <>
      <header className="setup-hero">
        <span className="setup-active-player">Territory roll-off</span>
        <h1>Roll for first pick</h1>
        <p>
          Both players roll an attack die. The winner picks the board side and territory;
          the loser places the first feature token. The rolled dice appear in the dice
          tray above.
        </p>
      </header>
      <section className="setup-rolloff">
        <button
          type="button"
          className="setup-button setup-button-primary"
          onClick={() => onResolve(new ResolveTerritoryRollOffAction(generated.rounds))}
        >
          Roll &amp; continue
        </button>
      </section>
    </>
  );
}

function generateRollOff(): GeneratedRoll {
  const rounds: { firstFace: AttackDieFace; secondFace: AttackDieFace }[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const firstFace = rollAttackDie();
    const secondFace = rollAttackDie();
    rounds.push({ firstFace, secondFace });

    const comparison = getAttackDieFaceRank(firstFace) - getAttackDieFaceRank(secondFace);
    if (comparison !== 0) {
      return { rounds };
    }
  }

  rounds.push(deterministicFirstPlayerRollOff);
  return { rounds };
}
