import "./PlayerHandDock.css";
import type { CardId, Player } from "./domain";
import type { Card } from "./domain/cards/Card";
import type { PowerOverlayOption } from "./board/battlefieldModels";

// Scorable objective info passed from the parent.
export type ScorableObjective = {
  cardId: CardId;
  cardName: string;
  gloryValue: number;
};

// The hand dock is the single visual surface for card interactions. It
// runs in one of four modes, driven by the `interaction` prop supplied by
// the parent (SetupApp or PracticeBattlefieldApp):
//
//   - readonly   : view-only display of the hand.
//   - mulligan   : the 4 mulligan buttons are shown at the bottom.
//   - focus      : each card is a click-to-toggle discard button, and a
//                  Confirm/Cancel bar is shown at the bottom.
//   - play       : playable power cards become click-to-arm buttons; when
//                  a card has multiple valid targets, an inline target
//                  picker opens under it.
//
// The dock never reads `game` directly — the parent projects game state
// into this union so the dock stays dumb and testable.
export type DockInteraction =
  | { kind: "readonly" }
  | {
      kind: "mulligan";
      onResolve: (redrawObjectives: boolean, redrawPower: boolean) => void;
    }
  | {
      kind: "focus";
      selectedObjectiveIds: CardId[];
      selectedPowerIds: CardId[];
      onToggleObjective: (cardId: CardId) => void;
      onTogglePower: (cardId: CardId) => void;
      onConfirm: () => void;
      onCancel: () => void;
      summary: string;
    }
  | {
      kind: "play";
      playableByCardId: Map<CardId, PowerOverlayOption[]>;
      pendingCardId: CardId | null;
      pendingOptionKey: string | null;
      onSelectCard: (cardId: CardId) => void;
      onSelectOption: (option: PowerOverlayOption) => void;
      onCancel: () => void;
    };

type PlayerHandDockProps = {
  player: Player;
  interaction: DockInteraction;
  scorableObjectives?: ScorableObjective[];
  onScoreObjective?: (cardId: CardId) => void;
};

type DockCard = {
  cardId: CardId;
  card: Card;
  isScorable: boolean;
};

export default function PlayerHandDock({ player, interaction, scorableObjectives = [], onScoreObjective }: PlayerHandDockProps) {
  const scorableIds = new Set(scorableObjectives.map((s) => s.cardId));
  const objectiveCards: DockCard[] = player.objectiveHand.map((card) => ({
    cardId: card.id,
    card,
    isScorable: scorableIds.has(card.id),
  }));
  const powerCards: DockCard[] = player.powerHand.map((card) => ({
    cardId: card.id,
    card,
    isScorable: false,
  }));
  const totalCards = objectiveCards.length + powerCards.length;

  return (
    <aside
      className={[
        "player-hand-dock",
        `player-hand-dock-mode-${interaction.kind}`,
      ].join(" ")}
    >
      <header className="player-hand-dock-header">
        <div className="player-hand-dock-title">
          <p className="player-hand-dock-eyebrow">{player.name}&apos;s Hand</p>
          <strong>
            {objectiveCards.length} objective{objectiveCards.length === 1 ? "" : "s"} ·{" "}
            {powerCards.length} power
          </strong>
        </div>
      </header>

      {totalCards === 0 ? (
        <p className="player-hand-dock-empty">No cards in hand.</p>
      ) : (
        <div className="player-hand-dock-sections">
          <PlayerHandDockSection
            label="Objectives"
            cards={objectiveCards}
            tone="objective"
            interaction={interaction}
            onScoreObjective={onScoreObjective}
          />
          <PlayerHandDockSection
            label="Power"
            cards={powerCards}
            tone="power"
            interaction={interaction}
          />
        </div>
      )}
    </aside>
  );
}

// Floating action bar that renders above the dock for mulligan/focus
// modes. Positioned so the dock's own height never depends on which
// mode is active — the buttons are decoupled from the card area.
export function DockActionOverlay({ interaction }: { interaction: DockInteraction }) {
  if (interaction.kind === "mulligan") {
    return (
      <div className="dock-action-overlay dock-action-overlay-mulligan">
        <MulliganControls onResolve={interaction.onResolve} />
      </div>
    );
  }
  if (interaction.kind === "focus") {
    return (
      <div className="dock-action-overlay dock-action-overlay-focus">
        <FocusConfirmBar
          summary={interaction.summary}
          onConfirm={interaction.onConfirm}
          onCancel={interaction.onCancel}
        />
      </div>
    );
  }
  return null;
}

function PlayerHandDockSection({
  label,
  cards,
  tone,
  interaction,
  onScoreObjective,
}: {
  label: string;
  cards: DockCard[];
  tone: "objective" | "power";
  interaction: DockInteraction;
  onScoreObjective?: (cardId: CardId) => void;
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={`player-hand-dock-section player-hand-dock-section-${tone}`}>
      <p className="player-hand-dock-section-label">{label}</p>
      <ul className="player-hand-dock-card-list">
        {cards.map((card) => (
          <DockCardListItem
            key={card.cardId}
            card={card}
            tone={tone}
            interaction={interaction}
            onScoreObjective={onScoreObjective}
          />
        ))}
      </ul>
    </section>
  );
}

function DockCardListItem({
  card,
  tone,
  interaction,
  onScoreObjective,
}: {
  card: DockCard;
  tone: "objective" | "power";
  interaction: DockInteraction;
  onScoreObjective?: (cardId: CardId) => void;
}) {
  const name = card.card.name;
  const text = card.card.text;
  const glory = card.card.gloryValue;

  // Per-mode flags drive the card's interactivity and visual state.
  const focusState = getFocusCardState(tone, card.cardId, interaction);
  const playState = getPlayCardState(tone, card.cardId, interaction);

  const isClickable =
    focusState.mode === "focus" || playState.mode === "play-playable";
  const classes = [
    "player-hand-dock-card",
    focusState.isMarkedDiscard ? "player-hand-dock-card-marked-discard" : "",
    playState.isPlayable ? "player-hand-dock-card-playable" : "",
    playState.isArmed ? "player-hand-dock-card-armed" : "",
    playState.isDim ? "player-hand-dock-card-dim" : "",
  ].filter(Boolean).join(" ");

  const cardBody = (
    <>
      <div className="player-hand-dock-card-title-row">
        <span className="player-hand-dock-card-name">{name}</span>
        {glory > 0 ? (
          <span className="player-hand-dock-card-glory">{glory} glory</span>
        ) : null}
        {focusState.isMarkedDiscard ? (
          <span className="player-hand-dock-card-tag">discard</span>
        ) : null}
        {playState.isArmed ? (
          <span className="player-hand-dock-card-tag">armed</span>
        ) : null}
        {card.isScorable ? (
          <span className="player-hand-dock-card-tag player-hand-dock-card-tag-scorable">scorable</span>
        ) : null}
      </div>
      {text !== "" ? (
        <p className="player-hand-dock-card-text">{text}</p>
      ) : null}
      {playState.mode === "play-playable" &&
      playState.showTargetPicker &&
      playState.targetOptions !== null ? (
        <PlayTargetPicker
          options={playState.targetOptions}
          pendingOptionKey={playState.pendingOptionKey}
          onSelect={playState.onSelectOption}
        />
      ) : null}
      {card.isScorable && onScoreObjective !== undefined ? (
        <button
          type="button"
          className="player-hand-dock-card-score-button"
          onClick={(event) => {
            event.stopPropagation();
            onScoreObjective(card.cardId);
          }}
        >
          Score ({glory} glory)
        </button>
      ) : null}
    </>
  );

  if (isClickable) {
    return (
      <li>
        <button
          type="button"
          className={classes}
          onClick={() => {
            if (focusState.mode === "focus") {
              focusState.onToggle();
            } else if (playState.mode === "play-playable") {
              playState.onSelect();
            }
          }}
        >
          {cardBody}
        </button>
      </li>
    );
  }

  return (
    <li className={classes}>
      {cardBody}
    </li>
  );
}

// --- Per-mode state derivations -------------------------------------------

type FocusCardState =
  | { mode: "not-focus"; isMarkedDiscard: false }
  | { mode: "focus"; isMarkedDiscard: boolean; onToggle: () => void };

function getFocusCardState(
  tone: "objective" | "power",
  cardId: CardId,
  interaction: DockInteraction,
): FocusCardState {
  if (interaction.kind !== "focus") {
    return { mode: "not-focus", isMarkedDiscard: false };
  }
  const selectedIds =
    tone === "objective" ? interaction.selectedObjectiveIds : interaction.selectedPowerIds;
  const onToggle =
    tone === "objective"
      ? () => interaction.onToggleObjective(cardId)
      : () => interaction.onTogglePower(cardId);
  return {
    mode: "focus",
    isMarkedDiscard: selectedIds.includes(cardId),
    onToggle,
  };
}

type PlayCardState =
  | { mode: "not-play"; isPlayable: false; isArmed: false; isDim: false }
  | {
      mode: "play-dim";
      isPlayable: false;
      isArmed: false;
      isDim: true;
    }
  | {
      mode: "play-playable";
      isPlayable: true;
      isArmed: boolean;
      isDim: false;
      showTargetPicker: boolean;
      targetOptions: PowerOverlayOption[] | null;
      pendingOptionKey: string | null;
      onSelect: () => void;
      onSelectOption: (option: PowerOverlayOption) => void;
    };

function getPlayCardState(
  tone: "objective" | "power",
  cardId: CardId,
  interaction: DockInteraction,
): PlayCardState {
  if (interaction.kind !== "play") {
    return { mode: "not-play", isPlayable: false, isArmed: false, isDim: false };
  }
  // Objectives are scored via the Score button, not via the power play flow.
  if (tone === "objective") {
    return { mode: "not-play", isPlayable: false, isArmed: false, isDim: false };
  }
  const options = interaction.playableByCardId.get(cardId);
  if (options === undefined || options.length === 0) {
    return { mode: "play-dim", isPlayable: false, isArmed: false, isDim: true };
  }
  const isArmed =
    interaction.pendingOptionKey !== null &&
    options.some((option) => option.key === interaction.pendingOptionKey);
  const showTargetPicker =
    options.length > 1 && interaction.pendingCardId === cardId;
  return {
    mode: "play-playable",
    isPlayable: true,
    isArmed,
    isDim: false,
    showTargetPicker,
    targetOptions: showTargetPicker ? options : null,
    pendingOptionKey: interaction.pendingOptionKey,
    onSelect: () => interaction.onSelectCard(cardId),
    onSelectOption: interaction.onSelectOption,
  };
}

// --- Sub-components -------------------------------------------------------

function MulliganControls({
  onResolve,
}: {
  onResolve: (redrawObjectives: boolean, redrawPower: boolean) => void;
}) {
  return (
    <div className="player-hand-dock-mulligan-row">
      <button
        type="button"
        className="player-hand-dock-mulligan-button player-hand-dock-mulligan-button-primary"
        onClick={() => onResolve(false, false)}
      >
        Keep both
      </button>
      <button
        type="button"
        className="player-hand-dock-mulligan-button"
        onClick={() => onResolve(true, false)}
      >
        Mulligan objectives
      </button>
      <button
        type="button"
        className="player-hand-dock-mulligan-button"
        onClick={() => onResolve(false, true)}
      >
        Mulligan power
      </button>
      <button
        type="button"
        className="player-hand-dock-mulligan-button"
        onClick={() => onResolve(true, true)}
      >
        Mulligan both
      </button>
    </div>
  );
}

function FocusConfirmBar({
  summary,
  onConfirm,
  onCancel,
}: {
  summary: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="player-hand-dock-focus-confirm-bar">
      <p className="player-hand-dock-focus-confirm-summary">{summary}</p>
      <div className="player-hand-dock-focus-confirm-actions">
        <button
          type="button"
          className="player-hand-dock-focus-confirm-button player-hand-dock-focus-confirm-button-primary"
          onClick={onConfirm}
        >
          Confirm Focus
        </button>
        <button
          type="button"
          className="player-hand-dock-focus-confirm-button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PlayTargetPicker({
  options,
  pendingOptionKey,
  onSelect,
}: {
  options: PowerOverlayOption[];
  pendingOptionKey: string | null;
  onSelect: (option: PowerOverlayOption) => void;
}) {
  return (
    <div className="player-hand-dock-play-target-picker">
      <p className="player-hand-dock-play-target-picker-label">Choose target</p>
      <ul className="player-hand-dock-play-target-list">
        {options.map((option) => (
          <li key={option.key}>
            <button
              type="button"
              className={[
                "player-hand-dock-play-target-option",
                option.key === pendingOptionKey
                  ? "player-hand-dock-play-target-option-armed"
                  : "",
              ].filter(Boolean).join(" ")}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(option);
              }}
            >
              <span className="player-hand-dock-play-target-option-title">{option.title}</span>
              <span className="player-hand-dock-play-target-option-detail">{option.detail}</span>
              {option.key === pendingOptionKey ? (
                <span className="player-hand-dock-card-tag">armed</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
