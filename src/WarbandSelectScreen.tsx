import type { WarbandDefinition, WarbandDefinitionId } from "./domain";
import { PanelButton } from "./ui";
import { reactKey } from "./react/reactKey";

type WarbandSelectScreenProps = {
  warbands: readonly WarbandDefinition[];
  onSelect: (warbandId: WarbandDefinitionId) => void;
};

export default function WarbandSelectScreen({ warbands, onSelect }: WarbandSelectScreenProps) {
  return (
    <main className="max-w-[1100px] mx-auto px-6 pt-16 pb-20 grid gap-8 text-ink">
      <header className="text-center grid gap-2">
        <h1 className="m-0 font-heading text-[clamp(2.2rem,4vw,3.6rem)] tracking-[0.01em]">
          Choose your warband
        </h1>
        <p className="m-0 text-ink-soft text-[1.05rem]">
          Pick a warband to lead into the practice battlefield.
        </p>
      </header>
      <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        {warbands.map((warband) => {
          const leader = warband.fighters.find((fighter) => fighter.isLeader);
          return (
            <li key={reactKey(warband)}>
              <PanelButton onClick={() => onSelect(warband.id)}>
                <h2 className="m-0 font-heading text-[1.55rem]">{warband.name}</h2>
                {leader !== undefined && (
                  <p className="m-0 text-ink-soft italic">{leader.name}</p>
                )}
                <dl className="m-0 grid grid-cols-3 gap-3">
                  <div className="bg-surface-inner rounded-button p-2.5 px-3 grid gap-0.5 text-center">
                    <dt className="text-[0.72rem] uppercase tracking-[0.06em] text-ink-muted">Fighters</dt>
                    <dd className="m-0 font-heading text-[1.35rem]">{warband.fighters.length}</dd>
                  </div>
                  <div className="bg-surface-inner rounded-button p-2.5 px-3 grid gap-0.5 text-center">
                    <dt className="text-[0.72rem] uppercase tracking-[0.06em] text-ink-muted">Objectives</dt>
                    <dd className="m-0 font-heading text-[1.35rem]">{warband.objectiveCards.length}</dd>
                  </div>
                  <div className="bg-surface-inner rounded-button p-2.5 px-3 grid gap-0.5 text-center">
                    <dt className="text-[0.72rem] uppercase tracking-[0.06em] text-ink-muted">Power cards</dt>
                    <dd className="m-0 font-heading text-[1.35rem]">{warband.powerCards.length}</dd>
                  </div>
                </dl>
                <ul className="list-none m-0 p-0 grid gap-1.5">
                  {warband.fighters.map((fighter) => (
                    <li
                      key={reactKey(fighter)}
                      className="flex justify-between gap-3 py-2 px-3 rounded-[10px] bg-[rgba(244,236,220,0.45)] text-[0.95rem]"
                    >
                      <span className="font-semibold">
                        {fighter.name}
                        {fighter.isLeader ? " ★" : ""}
                      </span>
                      <span className="text-ink-muted text-[0.85rem]">
                        {fighter.move} move &middot; {fighter.health} hp
                      </span>
                    </li>
                  ))}
                </ul>
              </PanelButton>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
