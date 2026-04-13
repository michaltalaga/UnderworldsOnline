import { useMemo } from "react";
import {
  AttackDieFace,
  deterministicFirstPlayerRollOff,
  getAttackDieFaceRank,
  ResolveTerritoryRollOffAction,
  rollAttackDie,
  type Game,
} from "../domain";
import { SetupHero } from "../ui";

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
      <SetupHero
        badge="Territory roll-off"
        title="Roll for first pick"
        description="Both players roll an attack die. The winner picks the board side and territory; the loser places the first feature token. The rolled dice appear in the dice tray above."
      />
      <section className="grid gap-6 justify-items-center">
        <button
          type="button"
          className="appearance-none border border-[#6e4513] bg-linear-to-b from-[#c08a3e] to-[#a06b25] text-[#fdf7e9] font-[inherit] text-[0.95rem] py-3 px-[22px] rounded-button cursor-pointer transition-all duration-[120ms] ease-in-out hover:-translate-y-px hover:border-[rgba(85,66,40,0.64)] hover:shadow-[0_14px_30px_rgba(63,46,29,0.18)] hover:from-[#cf9a4a] hover:to-[#b07a30] focus-visible:-translate-y-px focus-visible:outline-none"
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
