import { useState } from "react";
import DeckSelectScreen from "./DeckSelectScreen";
import GameView from "./GameView";
import { embergard1BoardTheme } from "./domain/content/boards/Embergard1Board";
import WarbandSelectScreen from "./WarbandSelectScreen";
import {
  blazingAssaultDeck,
  emberwatchWarband,
  pillageAndPlunderDeck,
  zikkitsTunnelpackWarband,
  type DeckDefinition,
  type WarbandDefinitionId,
} from "./domain";

const availableWarbands = [zikkitsTunnelpackWarband, emberwatchWarband];

const deckChoices = [
  {
    id: blazingAssaultDeck.id,
    name: blazingAssaultDeck.name,
    summary: "Aggressive Rivals deck focused on attacks, kills, and combat objectives.",
    deck: blazingAssaultDeck,
  },
  {
    id: pillageAndPlunderDeck.id,
    name: pillageAndPlunderDeck.name,
    summary: "Treasure-hunting Rivals deck focused on Delving and feature tokens.",
    deck: pillageAndPlunderDeck,
  },
];

type DeckSelection = { kind: "none" } | { kind: "selected"; deck: DeckDefinition | null };

function CommitBadge() {
  return (
    <span
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        fontSize: 11,
        fontFamily: "monospace",
        color: "#111",
        opacity: 0.8,
        zIndex: 9999,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      Version: {__GIT_HASH__}
    </span>
  );
}

export default function App() {
  const [selectedWarbandId, setSelectedWarbandId] = useState<WarbandDefinitionId | null>(null);
  const [deckSelection, setDeckSelection] = useState<DeckSelection>({ kind: "none" });

  if (selectedWarbandId === null) {
    return (
      <>
        <CommitBadge />
        <WarbandSelectScreen
          warbands={availableWarbands}
          onSelect={(warbandId) => {
            setSelectedWarbandId(warbandId);
            setDeckSelection({ kind: "none" });
          }}
        />
      </>
    );
  }

  const selectedWarband =
    availableWarbands.find((warband) => warband.id === selectedWarbandId) ?? availableWarbands[0];

  if (deckSelection.kind === "none") {
    return (
      <>
        <CommitBadge />
        <DeckSelectScreen
          warbandName={selectedWarband.name}
          choices={deckChoices}
          onSelect={(deck) => {
            setDeckSelection({ kind: "selected", deck });
          }}
        />
      </>
    );
  }

  return (
    <>
      <CommitBadge />
      <GameView
        warband={selectedWarband}
        deck={deckSelection.deck}
        boardTheme={embergard1BoardTheme}
      />
    </>
  );
}
