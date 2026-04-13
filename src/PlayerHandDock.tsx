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
      className="grid grid-rows-[auto_1fr] gap-2.5 min-w-0 min-h-0 h-full overflow-hidden"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <p className="m-0 uppercase tracking-[0.14em] text-[0.74rem] text-[#8a5630]">{player.name}&apos;s Hand</p>
          <strong className="font-heading text-base text-heading">
            {objectiveCards.length} objective{objectiveCards.length === 1 ? "" : "s"} ·{" "}
            {powerCards.length} power
          </strong>
        </div>
      </header>

      {totalCards === 0 ? (
        <p className="m-0 text-[0.82rem] text-[#8e7a66]">No cards in hand.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
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
      <div className="fixed left-1/2 bottom-[calc(28vh+16px)] -translate-x-1/2 z-[34] box-border max-w-[calc(100vw-32px)] py-3 px-[18px] flex gap-2.5 items-center rounded-card bg-[rgba(253,249,242,0.98)] border border-[rgba(85,66,40,0.26)] shadow-[0_18px_44px_rgba(63,46,29,0.26)] backdrop-blur-[10px] font-body animate-[dice-tray-enter_320ms_cubic-bezier(0.2,0.7,0.1,1.05)_both]">
        <MulliganControls onResolve={interaction.onResolve} inOverlay />
      </div>
    );
  }
  if (interaction.kind === "focus") {
    return (
      <div className="fixed left-1/2 bottom-[calc(28vh+16px)] -translate-x-1/2 z-[34] box-border max-w-[calc(100vw-32px)] py-3 px-[18px] flex gap-2.5 items-center rounded-card bg-[rgba(253,249,242,0.98)] border border-[rgba(85,66,40,0.26)] shadow-[0_18px_44px_rgba(63,46,29,0.26)] backdrop-blur-[10px] font-body animate-[dice-tray-enter_320ms_cubic-bezier(0.2,0.7,0.1,1.05)_both]">
        <FocusConfirmBar
          summary={interaction.summary}
          onConfirm={interaction.onConfirm}
          onCancel={interaction.onCancel}
          inOverlay
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
    <section className="grid grid-rows-[auto_1fr] gap-1.5 min-h-0 overflow-hidden">
      <p className={`m-0 text-[0.72rem] font-extrabold tracking-[0.06em] uppercase ${tone === "objective" ? "text-objective" : tone === "power" ? "text-power-card" : "text-[#7a624d]"}`}>{label}</p>
      <ul className="m-0 p-0 list-none grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] content-start gap-1.5 min-h-0 overflow-hidden">
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

  const toneCardBg = tone === "objective"
    ? "bg-objective-bg border-objective-border"
    : tone === "power"
    ? "bg-power-card-bg border-power-card-border"
    : "bg-[rgba(250,244,232,0.94)] border-[rgba(117,92,64,0.2)]";

  const classes = [
    "border rounded-[12px] px-2.5 py-1.5 grid gap-1 min-w-0 min-h-0 overflow-hidden text-left font-[inherit] text-[inherit]",
    toneCardBg,
    focusState.isMarkedDiscard ? "outline-2 outline-[#c24a2f] -outline-offset-2 !bg-[rgba(255,224,215,0.96)]" : "",
    playState.isPlayable ? "outline-2 outline-[#aa7ac9] -outline-offset-2" : "",
    playState.isArmed ? "outline-3 outline-[#d3a135] -outline-offset-2 !bg-[rgba(255,244,212,0.98)]" : "",
    playState.isDim ? "opacity-48" : "",
  ].filter(Boolean).join(" ");

  const cardBody = (
    <>
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <span className="font-bold text-heading text-[0.88rem]">{name}</span>
        {glory > 0 ? (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-pill bg-[rgba(168,122,42,0.16)] border border-[rgba(168,122,42,0.28)] text-[#7a5a18] text-[0.66rem] font-bold uppercase tracking-[0.04em]">{glory} glory</span>
        ) : null}
        {focusState.isMarkedDiscard ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-pill border text-[0.62rem] font-extrabold uppercase tracking-[0.08em] ${playState.isArmed ? "bg-[rgba(211,161,53,0.18)] border-[rgba(181,130,22,0.46)] text-[#6e4f0e]" : "bg-[rgba(195,78,47,0.16)] border-[rgba(195,78,47,0.36)] text-[#903418]"}`}>discard</span>
        ) : null}
        {playState.isArmed ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-[rgba(211,161,53,0.18)] border border-[rgba(181,130,22,0.46)] text-[#6e4f0e] text-[0.62rem] font-extrabold uppercase tracking-[0.08em]">armed</span>
        ) : null}
        {card.isScorable ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-[rgba(46,160,67,0.18)] border border-[rgba(46,160,67,0.46)] text-[#1a7f37] text-[0.62rem] font-extrabold uppercase tracking-[0.08em]">scorable</span>
        ) : null}
      </div>
      {text !== "" ? (
        <p className="m-0 text-[0.72rem] leading-[1.35] text-[#5e4b3a] line-clamp-3 overflow-hidden">{text}</p>
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
          className="block w-full mt-1.5 px-2.5 py-1 border border-[rgba(46,160,67,0.5)] rounded-[6px] bg-[rgba(46,160,67,0.12)] text-[#1a7f37] text-[0.75rem] font-semibold cursor-pointer transition-colors hover:bg-[rgba(46,160,67,0.25)]"
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
          className={`${classes} cursor-pointer transition-[transform,box-shadow,background] duration-[120ms] ease-out hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(35,24,18,0.12)]`}
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
  inOverlay = false,
}: {
  onResolve: (redrawObjectives: boolean, redrawPower: boolean) => void;
  inOverlay?: boolean;
}) {
  const mulliganBtn = "border border-[rgba(85,66,40,0.28)] bg-[rgba(239,231,219,0.92)] text-heading rounded-pill px-4 py-2 font-[inherit] text-[0.82rem] font-bold cursor-pointer transition-[transform,box-shadow,background] duration-[120ms] ease-out hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(35,24,18,0.12)] hover:bg-[rgba(244,236,220,1)]";
  const primaryBtn = `${mulliganBtn} !bg-[#7a5a18] !text-[#fff8e7] !border-[#5a4010] hover:!bg-[#8a6a28]`;
  return (
    <div className={`flex flex-wrap gap-2 ${inOverlay ? "" : "pt-1.5 border-t border-dashed border-[rgba(85,66,40,0.18)]"}`}>
      <button
        type="button"
        className={primaryBtn}
        onClick={() => onResolve(false, false)}
      >
        Keep both
      </button>
      <button
        type="button"
        className={mulliganBtn}
        onClick={() => onResolve(true, false)}
      >
        Mulligan objectives
      </button>
      <button
        type="button"
        className={mulliganBtn}
        onClick={() => onResolve(false, true)}
      >
        Mulligan power
      </button>
      <button
        type="button"
        className={mulliganBtn}
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
  inOverlay = false,
}: {
  summary: string;
  onConfirm: () => void;
  onCancel: () => void;
  inOverlay?: boolean;
}) {
  const confirmBtn = "border border-[rgba(85,66,40,0.28)] bg-[rgba(239,231,219,0.92)] text-heading rounded-pill px-4 py-2 font-[inherit] text-[0.82rem] font-bold cursor-pointer";
  const primaryConfirmBtn = `${confirmBtn} !bg-[#5b6d3c] !text-[#fdf7ea] !border-[#3e4a28] hover:!bg-[#6d7f4a]`;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${inOverlay ? "" : "pt-1.5 border-t border-dashed border-[rgba(85,66,40,0.18)]"}`}>
      <p className="flex-auto m-0 text-[0.78rem] text-[#5e4b3a]">{summary}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={primaryConfirmBtn}
          onClick={onConfirm}
        >
          Confirm Focus
        </button>
        <button
          type="button"
          className={confirmBtn}
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
    <div className="grid gap-1.5 p-2 mt-1 bg-[rgba(255,253,246,0.96)] border border-dashed border-[rgba(123,83,156,0.4)] rounded-[10px]">
      <p className="m-0 text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-power-card">Choose target</p>
      <ul className="m-0 p-0 list-none grid gap-1">
        {options.map((option) => {
          const isArmed = option.key === pendingOptionKey;
          return (
          <li key={option.key}>
            <button
              type="button"
              className={`flex flex-wrap gap-2 items-center px-2.5 py-1.5 border border-power-card-border rounded-lg bg-[rgba(249,241,254,0.96)] text-heading font-[inherit] text-[0.78rem] cursor-pointer text-left w-full hover:bg-[rgba(239,226,250,1)] ${isArmed ? "outline-2 outline-[#d3a135] -outline-offset-2 !bg-[rgba(255,244,212,0.98)]" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(option);
              }}
            >
              <span className="font-bold text-heading">{option.title}</span>
              <span className="text-[#5e4b3a]">{option.detail}</span>
              {isArmed ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-[rgba(211,161,53,0.18)] border border-[rgba(181,130,22,0.46)] text-[#6e4f0e] text-[0.62rem] font-extrabold uppercase tracking-[0.08em]">armed</span>
              ) : null}
            </button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
