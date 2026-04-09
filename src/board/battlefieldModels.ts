import type {
  AttackAction,
  ChargeAction,
  DelveAction,
  FighterId,
  FighterState,
  FocusAction,
  GuardAction,
  HexId,
  MoveAction,
  PassAction,
  PlayPloyAction,
  PlayUpgradeAction,
  UseWarscrollAbilityAction,
} from "../domain";

// Lens through which the battlefield UI views a single fighter's legal
// options for the current turn step. Produced once per render by
// `getFighterActionLens` and consumed by the board map, the action panel,
// and the various armed-interaction handlers.
export type FighterActionLens = {
  fighter: FighterState | null;
  attackTargetHexIds: Set<HexId>;
  attackTargetIds: Set<FighterId>;
  moveHexIds: Set<HexId>;
  chargeHexIds: Set<HexId>;
  chargeTargetHexIds: Set<HexId>;
  chargeTargetIds: Set<FighterId>;
  attackActions: AttackAction[];
  moveActions: MoveAction[];
  chargeActions: ChargeAction[];
  delveAction: DelveAction | null;
  focusAction: FocusAction | null;
  guardAction: GuardAction | null;
  passAction: PassAction | null;
  attackCount: number;
  moveCount: number;
  chargeCount: number;
  delveAvailable: boolean;
  focusAvailable: boolean;
  guardAvailable: boolean;
};

export type AttackProfileOptionSummary = {
  key: string;
  label: string;
  stats: string;
  isDefault: boolean;
};

export type AttackProfileSummary = {
  targetId: FighterId;
  targetName: string;
  defaultKey: string;
  selectedKey: string;
  options: AttackProfileOptionSummary[];
};

export type ChargeProfileSummary = {
  targetId: FighterId;
  targetName: string;
  defaultKey: string;
  selectedKey: string;
  options: AttackProfileOptionSummary[];
};

export type BattlefieldResultFlash = {
  id: number;
  tone: "move" | "attack" | "charge" | "power";
  title: string;
  detail: string;
};

// Any game action the battlefield app can hand off to the engine via
// `applyAction`. Narrowed here so the handler signatures stay precise.
export type BattlefieldAppAction =
  | MoveAction
  | ChargeAction
  | AttackAction
  | DelveAction
  | FocusAction
  | GuardAction
  | PassAction
  | PlayPloyAction
  | PlayUpgradeAction
  | UseWarscrollAbilityAction;

export type PowerOverlayOption = {
  key: string;
  title: string;
  detail: string;
  action: PlayPloyAction | PlayUpgradeAction | UseWarscrollAbilityAction;
};

export type PowerOverlayModel = {
  ploys: PowerOverlayOption[];
  upgrades: PowerOverlayOption[];
  warscrollAbilities: PowerOverlayOption[];
  hasAnyOptions: boolean;
};

export type BoardTurnHeaderModel = {
  activePlayerName: string;
  interactionLabel: string;
  isArmed: boolean;
  tone: "action" | "power" | "neutral";
  stepLabel: string;
};

export type ArmedPathModel = {
  tone: "move" | "charge";
  stepByHexId: Map<HexId, number>;
};

export type ProfilePreviewModel = Map<FighterId, string[]>;
