# BDS Case Files

A cooperative multiplayer browser detective game for virtual teams of 2–10 players.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- The game does not use a database or external service.

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

- No AI APIs, OpenAI integration, or paid services. Content uses templates, randomization, and predefined data, as requested.
- Anonymous room membership uses an HTTP-only browser session cookie, not user accounts. It allows separate players in separate tabs while preventing other browsers from impersonating a player ID.
- Specialist clues are sent only to their owner; the solution is not exposed until the case is resolved.
- The host submits the team's final accusation. Majority votes execute investigations; when everyone votes without a majority, plurality wins, with the host's vote breaking a tie.

## Product

Create and join rooms by code, investigate generated cases, share clues in chat, use role-specific information, submit a suspect/motive/method accusation, and receive a scored solution.

## User preferences

“No database required for Version 1.” “Prioritize gameplay and replayability over visual effects.” The requested theme is Modern Detective Agency with dark navy, gold, and white.

## Gotchas

- Re-run codegen after API spec changes.
- Keep `/api/ws` in the API artifact's service paths so the proxy forwards WebSockets.
- In-memory multiplayer requires a single server process; horizontal scaling needs shared room storage and pub/sub, outside Version 1.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
