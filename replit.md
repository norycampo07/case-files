# Case Files: Office Edition

A fictional workplace mystery tournament for 1–50 players in 1–5 teams, with 1-10 players per team.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- The game does not use a database or external service.
- `pnpm --filter @workspace/api-server test` — check consent, safe generated cases, multiplayer rules, privacy controls, and scoring.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Game state: in-memory rooms; server restart clears all rooms.
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bds-case-files` — React game frontend.
- `artifacts/api-server/src/game` — template case generator and room game rules.
- `lib/api-spec/openapi.yaml` — REST contract; Socket.IO uses `/api/ws`.

## Architecture decisions

- No AI APIs, OpenAI integration, or paid services. The game randomly selects handcrafted canonical cases; it never generates or rewrites clues, culprits, or humor.
- Anonymous room membership uses an HTTP-only browser session cookie, not user accounts. It allows separate players in separate tabs while preventing other browsers from impersonating a player ID.
- The host advances the whole room through shared stages and opens all initial ballots together. Teams may buy private extra clues during the decision stage. Every member votes individually; solutions and current-round scores stay hidden until all ballots finish and the host reveals the culprit. The host then reveals results and starts the next case or champions screen.
- Each player casts one suspect ballot. Timers count submitted ballots only. A tied ballot opens a 30-second runoff among tied leaders; if the runoff still ties, a draw among those leaders resolves it.
- The host chooses 1, 3, 5, 7 or 10 cases (default 3), 1–5 teams and a 15–180-second vote timer (default 60). Starting requires 1–10 members on every configured team; empty teams block starting. A single team with one player can start.

## Product

Create and join by room code with a fictional alias and chosen team. Hosts may add, remove empty teams, and rename teams in the lobby. Read a short brief, meet seven recurring fictional characters with permanent portraits, then reveal three clues one at a time. Teams can request up to seven private extras before the host opens voting. Correct suspect earns 100/150/200 for Easy/Medium/Hard less 10 per extra; incorrect or absent accusations earn zero. Host-controlled reveal, results, leaderboard and champions keep the room synchronized. The ten canonical cases are production content stored verbatim in `artifacts/api-server/src/game/canonical-cases.json`, with fixed culprits, three core clues, seven optional clues, full reveals, and internal design notes. Add future cases in the same structured format; do not rewrite authored clues or insert generated humor. Case 01 has no supplied design notes, so its notes field is empty. Cases are randomly selected without repeats within a tournament. The user approved ten-case tournaments using all ten unique cases: 3 Easy, 4 Medium, 3 Hard; other tournament schedules are unchanged. The existing What/Why screen displays the first reveal line and its remaining text without adding prose. Reuse the same room, names and members on Play Again; discard all prior cases, ballots and results. No database, AI service or case history.

**Why the ten-case schedule changed:** The supplied canonical library contains only three Easy cases. The user chose all ten unique cases with their original difficulties rather than repeating an Easy case or adding unapproved content.

## Workplace safety and privacy

The workplace briefs are the product's standing scope: only playful workplace file mix-ups and break-room surprises, never criminal allegations, HR complaints, medical issues, fraud, real company incidents, or disciplinary matters. The seven recurring characters and their generated portraits are explicitly fictional and are not representations of real employees.

Consent is required before room entry. Ask for fictional aliases, never personal details. No database, AI API, paid runtime service, or case history. Keep tournament state in memory only; New Tournament discards previous case and voting state. A refresh restores membership and server-held team progress and vote status; server restart loses rooms. The browser keeps only session membership and consent. The older single-team API remains for compatibility, but the game UI uses the tournament API.

The promo follows the same workplace-safe scope; preserve its existing 25-second 16:9 format and soundtrack during content revisions.

## User preferences

“No database required for Version 1.” “Prioritize gameplay and replayability over visual effects.” For case-library work, preserve the existing UI and gameplay: no redesign, new game, or rebuild. Content migration is not permission to restyle screens.

## Gotchas

- Re-run codegen after API spec changes.
- Keep `/api/ws` in the API artifact's service paths so the proxy forwards WebSockets.
- In-memory multiplayer requires a single server process; horizontal scaling needs shared room storage and pub/sub, outside Version 1.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
