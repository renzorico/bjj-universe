# AGENTS.md — bjj-universe

## Project mission

Build a portfolio-grade, visually impressive interactive data application about Brazilian Jiu-Jitsu / grappling competition networks.

The product should feel like a living data museum or celestial map of grappling, not a generic dashboard.

Core concept:
- Athletes are nodes
- Matches are directed edges from winner to loser
- Users explore rivalries, eras, clusters, bridges, and “who never fought whom”
- The app must be both analytically serious and visually memorable

## Product priorities

In order of importance:
1. Strong visual impact
2. Clean architecture
3. Data/analytics credibility
4. Great UX and interaction design
5. Testability and maintainability
6. Clean git history
7. Good docs and onboarding

## Engineering standards

- Use TypeScript-first architecture
- Prefer maintainable, modular code over clever shortcuts
- Keep files reasonably small and focused
- Avoid dead code, premature abstraction, and copy-paste duplication
- Use clear naming
- Add comments only when they clarify non-obvious decisions
- Favor explicit types over loose inference in core domain logic
- Keep domain logic separate from rendering logic

## Preferred stack

Unless there is a strong reason otherwise, prefer:
- React
- TypeScript
- Vite
- Tailwind CSS or equally robust modern styling approach
- Sigma.js, Cytoscape, or D3 for graph/network visualization
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier

If choosing something else, explain the tradeoff before implementing.

## Data architecture principles

Design the system so the data layer is extensible.

Initial source:
- ADCC historical dataset

Future-friendly support:
- IBJJF rankings
- athlete metadata
- Elo or rating systems
- link prediction
- embeddings or clustering
- inferred matchup recommendations

Separate these concerns:
- raw ingestion
- normalization
- derived metrics
- graph construction
- UI-facing view models

Do not tightly couple raw source data to frontend components.

## Domain expectations

The system should support:
- athletes
- matches
- events
- years / eras
- divisions
- teams if available
- nationality if available
- observed edges
- inferred potential edges

Derived metrics should be easy to add, such as:
- wins / losses
- years active
- rivalry counts
- centrality
- bridge scores
- community membership
- missing matchup candidates

## UX direction

The app must feel premium and visually ambitious.

Desired qualities:
- cinematic but usable
- elegant motion
- strong hierarchy
- progressive disclosure
- beautiful dark mode
- polished typography
- smooth interactions
- no visual chaos

Avoid:
- generic admin UI
- low-effort cards
- ugly defaults
- noisy graph rendering
- dumping too much info at once

The graph should be the hero, but the surrounding interface must support understanding.

## Workflow rules

For any non-trivial task:
1. inspect the current codebase
2. explain the plan
3. list files to change
4. implement in focused steps
5. run relevant checks
6. summarize changes and next steps

Before major architectural changes, explain the tradeoffs.

## Git rules

- Use a clean branch strategy
- Prefer small focused commits
- Use conventional commit style where appropriate
- Keep unrelated changes out of the same commit
- Run tests before finalizing a milestone
- Do not create messy “checkpoint” commits unless explicitly asked
- Do not merge major work without reporting status first

## Testing rules

Testing is mandatory.

For all meaningful changes:
- add or update unit tests where domain logic changes
- add component tests where UI behavior changes
- add end-to-end tests for critical flows when appropriate
- avoid brittle implementation-detail tests
- prefer user-centric assertions
- keep tests deterministic

Before considering a task done, run the relevant subset of:
- lint
- typecheck
- unit tests
- build
- e2e tests when affected

## Documentation rules

Maintain:
- README
- architecture docs
- data pipeline docs
- roadmap / backlog docs

When introducing a new subsystem, document it.

## Boundaries

Allowed without asking:
- read files
- edit source files
- run local tests
- run lint/typecheck/build
- add focused tests
- improve internal code quality

Ask before:
- installing or removing major dependencies
- deleting files
- changing project structure substantially
- rewriting large working subsystems
- changing the chosen stack
- making destructive git operations

Never:
- commit secrets
- add fake data and pretend it is real production data
- ignore failing tests
- leave TODOs for critical broken functionality
- silently break existing behavior

## Output expectations

After each task, report:
- what changed
- files changed
- commands run
- test results
- risks / follow-ups
- recommended next step
