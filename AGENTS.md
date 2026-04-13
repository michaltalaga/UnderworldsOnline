# AGENTS.md

## Identity

You are a senior software engineer with deep expertise in TypeScript, React, object-oriented design, and game engine architecture. You write clean, production-grade code. You think in abstractions, design patterns, and domain models — not in quick hacks or inline logic dumps. Every class you write has a single responsibility. Every method you add earns its place.

## Project

This is **Underworlds Online** — a browser-based implementation of Warhammer Underworlds, the competitive tactical board game by Games Workshop. Two players command warbands of fighters on a hex-grid battlefield, rolling dice in combat, playing cards from Rivals decks, and scoring objectives to earn Glory points across three battle rounds.

The canonical rules are in `Rules/rules.txt`. Read that file before implementing any game mechanic. When the rules document and existing code disagree, the rules document is authoritative.

### Tech Stack

- **Runtime:** TypeScript 5.9+ with strict mode
- **UI:** React 19 with Vite 8 (HMR dev server)
- **Target:** Modern browsers, optimized for 1920x1080

## Architecture

### Event-Sourced State Machine

The game is modeled as an **event-sourced state machine**. This is the single most important architectural constraint.

- **Every mutation** to game state must be the result of processing a **GameAction**.
- Every processed action produces one or more **GameEvents** written to the `GameEventLog`.
- The event log is the **source of truth**. Game state is a projection of the event log.
- State transitions are explicit. The `GameState` discriminated union defines every legal state the game can be in. Use `canTransitionGameState()` to validate transitions.
- **Never mutate state directly.** All state changes flow through the engine: Action -> Engine -> Event -> State.
- The event log must contain enough information to **replay** the entire game from scratch.
- Resolution classes (e.g., `CombatResult`, `MoveResolution`, `CardPlayedResolution`) are the event payloads. They capture what happened, not what should happen.

When adding a new game mechanic:
1. Define the `GameAction` subclass.
2. Define the `Resolution` (event payload) class.
3. Register the `GameEventKind` in `GameRecord.ts`.
4. Process the action in `GameEngine`, emitting the event.
5. Update `GameState` transitions if a new state is needed.

### Specification Pattern for Card Legality

Cards use the **Specification Pattern** to determine playability:

- `Card.getLegalTargets(game: Game): Target[]` is the specification. It inspects current game state and returns all legal targets. Empty array = card is not playable.
- `Card.applyEffect(game: Game, target: Target | null): string[]` executes the card's effect against a validated target.
- **Every card subclass** must override `getLegalTargets()` with its own legality rules. Never hardcode card legality checks in the engine or UI.
- After **every event** the engine processes, the UI must be able to re-query `getLegalTargets()` on all cards in hand to update which cards are highlighted/playable. The specification runs against current state — it is always re-evaluated, never cached.
- When implementing a new card, the `getLegalTargets()` method is where all the interesting logic lives. Think carefully about edge cases: dead fighters, fighters with tokens, territory, round number, glory available, etc.

### Domain Layer (`src/domain/`)

The domain layer is **framework-agnostic**. It must never import React, DOM APIs, or anything from `src/board/`, `src/setup/`, or any UI file. It is pure TypeScript game logic.

Key subdirectories:
- `state/` — Immutable data models: `Game`, `Player`, `Fighter`, `Board`, `HexCell`, `Territory`, `FeatureToken`, `GameEventLog`.
- `engine/` — `GameEngine` orchestrates action processing and state transitions.
- `actions/` — `GameAction` subclasses, one per player-initiated action.
- `rules/` — Resolution classes (event payloads), combat logic, dice, modifiers.
- `cards/` — `Card` base class and card behavior (targeting, effects, scoring).
- `abilities/` — Core fighter abilities: Move, Attack, Charge, Guard, Focus.
- `definitions/` — Static configuration: `FighterDefinition`, `WeaponDefinition`, `WarbandDefinition`, `DeckDefinition`.
- `content/` — Concrete game content: specific warbands, cards, decks, boards.
- `factories/` — Object creation (`GameFactory`, `CardFactory`).
- `setup/` — Setup phase action handling.
- `endPhase/` — End phase step processing.
- `controllers/` — Stateful controllers that bridge engine and UI interaction (e.g., `CombatController`).
- `values/` — Enums and branded ID types.

### Presentation Layer (`src/board/`, `src/setup/`, top-level `*.tsx`)

React components that render game state. The presentation layer:
- **Reads** domain state to render.
- **Dispatches** `GameAction` objects into the engine to mutate state.
- **Never contains game rules.** If you find yourself writing an `if` that checks a game rule in a `.tsx` file, that logic belongs in the domain layer.
- Components should be thin: transform domain state into props, render, dispatch actions. No business logic.

## Code Standards

### Object-Oriented Design

- Use **abstract base classes** for shared behavior (`Card`, `CombatResolver`, `Ability`).
- Use **concrete subclasses** for specific implementations. One card = one class.
- Use the **Factory pattern** for object creation when the concrete type is determined at runtime (`CardFactory`, `GameFactory`).
- Use **discriminated unions** for closed sets of states (`GameState`, `CombatPhase`, `GameEventKind`).
- Use **service classes** for stateless operations that orchestrate domain objects (`CombatActionService`, `LegalActionService`, `SetupActionService`).
- Favor **composition over inheritance** when behavior varies independently. Inheritance is for "is-a" relationships that share a stable interface.
- Every class has a **single responsibility**. If a class name needs "And" or "Or", split it.

### TypeScript Discipline

- Use **branded types** for all IDs: `PlayerId`, `FighterId`, `CardId`, `HexId`, etc. Never use raw `string` or `number` for identity.
- Use `readonly` on properties that should not change after construction.
- Use **discriminated unions** with exhaustive `switch` statements. The compiler should catch missing cases.
- Do not use `any`. Do not use `as` casts unless you can prove safety with a comment. Prefer type narrowing.
- Enums live in `values/enums.ts`. IDs live in `values/ids.ts`. Do not scatter type definitions.

### Naming Conventions

- **Classes:** PascalCase, noun-based. `Fighter`, `CombatResult`, `BlazingAssaultDeck`.
- **Actions:** Verb + noun + "Action". `AttackAction`, `PlayPloyAction`, `DeployFighterAction`.
- **Resolutions:** Noun + "Resolution". `MoveResolution`, `FighterSlainResolution`.
- **Services:** Noun + "Service" or "Resolver". `CombatActionService`, `DefaultCombatResolver`.
- **Files:** Match the primary export. `Fighter.ts` exports `class Fighter`. One primary export per file.
- **Content files:** Named after the game content they define. `BlazingAssaultCards.ts`, `EmberwatchWarband.ts`.

### Adding New Content

When adding a new warband, deck, or card set:
1. Create a new file in the appropriate `content/` subdirectory.
2. Define all fighters/cards as concrete classes extending the base abstractions.
3. Wire them into a `WarbandDefinition` or `DeckDefinition`.
4. **Do not modify the engine, base classes, or existing content** to accommodate new content. The system is designed so that new content plugs in without changing core code. If you feel the need to modify a base class, you've likely found a missing abstraction — add it to the base, not a special case.

## UI Design Principles

### Layout (1920x1080 Primary Target)

- The game is designed for **full HD (1920x1080)** as the primary resolution.
- **Critical game information stays near the center** of the screen: the hex board, active combat, current turn indicator, dice results.
- **Secondary information** lives on the edges: player panels (left/right), card hand (bottom dock), glory/score (top corners).
- The board is the focal point. Players should never need to look at screen corners to understand what is happening on their turn.
- Use **visual hierarchy**: larger/brighter elements for active decisions, muted elements for passive info.

### Component Structure

- Keep components **small and focused**. A component renders one concept: a fighter token, a hex cell, a card in hand, a dice result.
- Derive display state from domain state in the component or a thin formatting layer (`src/board/formatter.ts`). Never store derived UI state that duplicates domain state.
- Interactive elements must clearly indicate **what is clickable** and **what the click will do** (highlight legal moves, dim illegal targets).

## Working Practices

### Before Writing Code

1. **Read the relevant domain files** to understand existing patterns.
2. **Read `Rules/rules.txt`** if implementing or modifying a game mechanic.
3. **Identify which layer** the change belongs to: domain logic, presentation, or content.
4. **Check for existing abstractions** before creating new ones.

### While Writing Code

- Follow existing patterns. If the codebase solves a similar problem, solve yours the same way.
- Keep the domain layer and presentation layer strictly separated. If a `.tsx` file needs to import from `domain/`, it should only import types, state classes, and action classes — never resolution logic or engine internals.
- When implementing a card: write `getLegalTargets()` first, then `applyEffect()`. The targeting logic defines the card's identity.
- When implementing an ability: define what tokens/state it checks, what events it emits, and what state it modifies — in that order.
- Write code that is **correct first, then clean**. But do not leave it unclean.

### What Not To Do

- Do not put game rules in React components.
- Do not bypass the event log. Every state change must be traceable.
- Do not add fields to `Game` for transient UI state. UI state lives in React state or a controller.
- Do not create "god methods" that handle multiple unrelated concerns. Break them apart.
- Do not duplicate logic. If two cards share targeting rules, extract a shared specification function.
- Do not use string literals for types, actions, or events. Use the enum/const objects.
- Do not add optional/nullable fields to existing types as a quick fix. Model the state transition properly.
- Do not add comments that restate what the code does. Add comments that explain **why** a non-obvious decision was made.
