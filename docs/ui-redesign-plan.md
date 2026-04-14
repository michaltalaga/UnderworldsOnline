# UI Redesign: Dark-Fantasy Warhammer Underworlds Theme

## Context

A mockup of a polished, dark-fantasy tabletop UI was proposed: ornate parchment
banners, leather-framed warband panels, an illustrated hex board flanked by
torches, card art in the bottom dock, a scroll-styled game log on the right,
and 3D dice. The current game is fully functional but plainly styled — a
utility skin on top of the domain layer. The goal of this document is to
(a) assess whether the aesthetic is feasible given the current architecture
and (b) lay out the phased work required to land it.

## Feasibility Assessment

### Green lights (low risk)

- **Clean domain ↔ UI seam.** The rendering layer consumes a `BoardSceneModel`
  (`src/board/boardScene.ts`) projected from the domain `Game`. The renderer
  can be replaced or reskinned end-to-end without touching game logic.
- **Tailwind v4 + `@theme` tokens** (`src/index.css:3-72`) already abstracts
  palette/shadows/radii. Adding a gothic/stone/leather token layer alongside
  the existing parchment palette is additive, not disruptive.
- **Formatter/projection layer exists** (`src/board/battlefieldFormatters.ts`,
  `projectBoardScene`). New visual concepts plumb through as projection
  fields without new domain code.
- **Existing background-art slot.** `boardTheme` already accepts art assets
  (`public/embergard-board-1.jpg`), so an illustrated board swap is already
  wired.
- **React 19, no CSS-in-JS.** No runtime overhead to overcome, no refactor
  from styled-components, etc.

### Blockers / real work

1. **Game log UI is missing.** Events exist in the domain
   (`e.recentEvents`, consumed only by `DebugPanel`). A player-facing scroll
   panel is new work: projection + component + styling.
2. **Flat dice.** `DiceTray.tsx` renders badges; 3D dice either means
   introducing `three.js` (~150 KB gz) or hand-crafted CSS-3D cubes. Needs
   a deliberate choice.
3. **No card art plumbing.** `PlayerHandDock` renders cards as styled divs.
   Adding a `CardDefinition.artUrl` field and a public art directory is a
   small domain-surface change that touches every existing card class.
4. **No fighter portraits.** `PlayerPanel.tsx` renders names + stats only.
   Same shape of change on `FighterDefinition`.
5. **StatusBar is 8px of chrome** (`src/board/StatusBar.tsx:13-34`); the
   mockup's ornate parchment top banner is effectively a new component.
6. **All existing components use the parchment/cream palette.** The mockup is
   dark gothic. Expect every surface to be restyled, though the tokens-first
   approach means this is bulk CSS, not structural rewrites.

### Risks to name

- **IP sensitivity.** Underworlds is a Games Workshop property. The reference
  mockup has been confirmed as IP-free, but any shipped art must be
  originated, not lifted from Games Workshop products. Ornate frames,
  stone/leather textures, and generic dark-fantasy portraits are safe;
  anything recognizably GW-branded is not.
- **Aspect ratio assumptions.** The board is currently sized by
  `boardScene.viewport` aspect ratio. Ornate side decoration (torches,
  frames) adds visual padding that will eat into the board area at narrow
  windows. A min-width or explicit 1920×1080-first layout is a design
  constraint to commit to up front.
- **Asset weight.** Ornate raster chrome on every panel bloats the bundle.
  Prefer SVG for frames/flourishes, reserve raster for portraits, card art,
  and the board backdrop.
- **Motion scope creep.** Torches flicker, dice roll, cards slide in, hexes
  pulse on target — easy to over-invest here. Scope motion as a final phase
  and gate each animation on whether it clarifies a game event.

### Verdict

**Feasible, incremental, no architectural rework.** The visual lift is
substantial but the domain layer and the projection contract mean every
piece of visual work is insulated from game rules. This is a re-skin +
one new component (log) + two domain-surface additions (portrait URL,
card art URL), phased over ~5 slices.

## Art / Asset Strategy

Working assumption: original or AI-generated art in a generic dark-fantasy
pastiche.

- **Raster**: fighter portraits, card illustrations, board backdrop.
- **SVG**: ornate frames, corner flourishes, hex glyphs, icons, torches
  (two-state sprite is fine, flicker via `@keyframes`).
- Directory layout to add:
  - `public/art/portraits/<warband>/<fighter-id>.webp`
  - `public/art/cards/<deck>/<card-id>.webp`
  - `public/art/frames/*.svg`
  - `public/art/backdrops/*.webp`
  - `public/art/decor/torch.svg`, `torch-flame.svg`
- **Fonts**: add via `@import` in `index.css` — candidates: *Cinzel* (display
  headings), *IM Fell English* (body serif), *Uncial Antiqua* (for accents).
  These are open-source Google Fonts.

## Phased Plan

Each phase is independently shippable. Work can stop after any phase with the
game still in a consistent visual state.

### Phase 1 — Theming Infrastructure (foundation, no visible redesign yet)

**Goal:** Make it cheap to restyle every later component.

- Extend `@theme` in `src/index.css` with a dark-fantasy token layer:
  `--color-stone-*`, `--color-leather-*`, `--color-brass`, `--color-ember`,
  `--color-parchment-aged`, plus `--shadow-ornate`, `--shadow-inset-stone`.
  Keep existing parchment tokens — they stay valid for setup screens.
- Add fonts via `@import` + update `--font-heading`, `--font-display`.
- Create shared frame primitives in `src/ui/`:
  - `OrnateFrame.tsx` — SVG-bordered container with configurable corners.
  - `ParchmentScroll.tsx` — scroll-styled panel used by log + setup.
  - `LeatherPanel.tsx` — side panel chrome for warband rosters.
  - `StoneButton.tsx` — replaces `PillButton` for primary game actions.
- No component call-sites change in this phase. Exports ship unused.

### Phase 2 — Top Banner + Quick Actions (high-visibility, bounded scope)

**Goal:** First visible theming win; validates the primitive library.

Critical files:
- `src/board/StatusBar.tsx` — rebuild as `OrnateHeaderBanner`. Displays
  Round/Turn chip (center), left & right player cartouches with glory
  counters, optional step badge underneath.
- `src/board/boardScene.ts` / `battlefieldFormatters.ts` — extend
  `statusBadge` projection with `roundLabel`, `turnLabel`, `leftPlayer`,
  `rightPlayer` cartouche models.
- `src/GameView.tsx:107-113` — replace inline quick-action buttons with
  `StoneButton`.

### Phase 3 — Warband Panels (left/right roster)

**Goal:** The other most-looked-at chrome after the board itself.

- `src/board/PlayerPanel.tsx` — redesign as `LeatherWarbandPanel`:
  - Ornate frame (reuse `LeatherPanel`).
  - Fighter row: portrait (round frame) · name (display font) · stats
    grid (M/S/T/W/A) · upgrade rail.
- `src/domain/definitions/FighterDefinition.ts` — add
  `readonly portraitUrl?: string`. Populate existing definitions with paths
  under `public/art/portraits/…` (placeholder silhouettes OK until art lands).
- `src/ui/StatGrid.tsx` — reuse if it fits the new frame; else restyle.

### Phase 4 — Card Dock + Card Art

**Goal:** Wire card art end-to-end; re-skin the hand.

- `src/domain/cards/Card.ts` — add `readonly artUrl?: string`.
- `src/domain/definitions/DeckDefinition.ts` — sanity-check art slots per
  card; no schema change unless deck-level frames differ by deck.
- `src/PlayerHandDock.tsx` / `PlayerHandDockShell.tsx` — new card-in-hand
  render: ornate card frame (gold for Objective, purple for Power matching
  existing `--color-objective` / `--color-power-card`), art slot, cost/title
  strip, ability text panel.
- Update every existing card subclass in `src/domain/content/**` with
  `artUrl`. This is mechanical; placeholder art URLs are fine.

### Phase 5 — Game Log Scroll (NEW component)

**Goal:** Give the right side the scroll panel from the mockup.

- `src/board/GameLog.tsx` — new. Reads `GameEventLog` via a projector
  similar to `battlefieldFormatters`. Renders as a `ParchmentScroll` with
  scrollable event list, color-coded (attack/move/score/card-play/etc.),
  newest-at-top.
- `src/board/gameLogProjection.ts` — new. `projectGameLog(game: Game): LogEntry[]`
  lives here; converts each `GameEvent` to a display string + tone. Follow
  the same pattern as `boardScene.ts`.
- Wire into `GameView.tsx` row 2 — replace the unused right gutter
  (`Col 5`, `src/GameView.tsx:128-129`) with `<GameLog … />`.

### Phase 6 — Board Ambience

**Goal:** Torches, hex polish, territory art, feature token glyphs.

- `src/board/BoardMap.tsx` — add decorative overlay layer (non-interactive
  `pointer-events: none`) with two torch SVGs flanking the board and a
  subtle stone-frame border. Flicker via CSS `@keyframes`.
- Hex styling pass — replace hard-coded Tailwind colors in `BoardMap` with
  theme tokens; add stone-tinted border, highlight-on-legal using
  `--color-brass` glow.
- Territory label styling (`territoryIndicator: "labels"` is already wired
  in `projectBoardScene`, `src/GameView.tsx:60`) — render with display font
  and parchment ribbon background.
- Feature tokens — swap emoji/flat glyphs for SVG icons in
  `public/art/icons/features/`.

### Phase 7 — Dice

**Goal:** Either 3D dice or stylized 2D that reads as thematic.

Two viable paths — pick at phase start:

- **2D stylized (recommended default):** keep DOM, redesign
  `src/board/DiceTray.tsx` as wooden tray with embossed runic faces.
  CSS `perspective` + `rotateX/Y` for a roll animation reads as 3D at 1/10
  the cost.
- **Three.js:** add `three` + a thin component. More authentic, but pulls
  a large dep, a WebGL context, and animation bookkeeping.

Either path preserves the existing `diceTrayModel` projection.

### Phase 8 — Setup Flow Reskin

**Goal:** Setup screens match the game screen.

- `src/setup/SetupPhasePanel.tsx`, `TerritoryChoiceScreen.tsx`,
  `TerritoryRollOffScreen.tsx`, `WarbandSelectScreen.tsx`,
  `DeckSelectScreen.tsx` — re-skin using `ParchmentScroll` +
  `OrnateFrame` + `StoneButton`. No structural changes.
- `src/ui/SetupHero.tsx` / `Panel.tsx` — retire if fully replaced by
  the new primitives, else retheme.

### Phase 9 — Motion Polish (optional, time-boxed)

- Torch flame flicker, dice roll, card draw slide-in, hex target pulse
  on charge armed, glory score shimmer.
- Guardrail: every animation must clarify a game event. No decorative
  motion on idle chrome.

## Files to Touch (summary)

**New:**
- `src/ui/OrnateFrame.tsx`, `ParchmentScroll.tsx`, `LeatherPanel.tsx`, `StoneButton.tsx`
- `src/board/GameLog.tsx`, `gameLogProjection.ts`
- `public/art/**`

**Modified (structural):**
- `src/index.css` — token + font additions
- `src/GameView.tsx` — slot GameLog; swap quick-action buttons
- `src/board/StatusBar.tsx` — full rebuild
- `src/board/PlayerPanel.tsx` — full rebuild
- `src/PlayerHandDock.tsx`, `PlayerHandDockShell.tsx` — card renderer
- `src/board/BoardMap.tsx` — overlay layer + token restyle
- `src/board/DiceTray.tsx` — reskin (or rebuild, per Phase 7 decision)
- `src/board/boardScene.ts`, `battlefieldFormatters.ts` — projection fields for banner + cartouches

**Modified (mechanical, wide touch):**
- `src/domain/definitions/FighterDefinition.ts` — add `portraitUrl`
- `src/domain/cards/Card.ts` — add `artUrl`
- Every `src/domain/content/**` fighter/card — fill in URLs (placeholders OK)

## Out of Scope

- Rules/mechanics changes — none required.
- Responsive design below 1920×1080 — stated primary target (`AGENTS.md:118`). Scale down, don't redesign.
- Accessibility audit — call out as follow-up; thematic fonts and low-contrast parchment are likely issues.
- Localization.
- Sound / music — not shown in mockup, explicitly excluded.

## Verification Strategy

- **Per phase:** `npm run dev`, visit affected screen, compare to the
  mockup region for that phase. `preview_start` + `preview_screenshot` if
  MCP tools are configured.
- **Cross-cutting:** `npm run test` after every domain-surface change
  (Phase 4 and Phase 3's `portraitUrl` addition); existing tests should
  be unaffected.
- **Regression:** Play through a full round after Phases 3, 4, and 5 to
  confirm nothing stylistic broke an interaction affordance (e.g., a card
  frame that hides the click target, a panel that breaks hex scaling).
- **Bundle size check** after Phase 6 + 7 — each art phase should keep
  first-paint under a sensible budget; track via `vite build` output.

## Effort (rough)

- Phase 1: small (1 sitting)
- Phase 2: small-medium
- Phase 3: medium (art slots dominate)
- Phase 4: medium-large (card content is wide)
- Phase 5: medium (new projection + component)
- Phase 6: medium (art-dependent)
- Phase 7: small if 2D, large if three.js
- Phase 8: small-medium
- Phase 9: time-boxed

Total: sizable but low-risk. No phase requires work to be unwound to
enable the next.
