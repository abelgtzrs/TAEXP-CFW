# AGENTS.md

## Start Here

- [README.md](README.md)
- [docs/DEVELOPER_NOTES.md](docs/DEVELOPER_NOTES.md)
- [DEVNOTES/DEVELOPER_GUIDE.md](DEVNOTES/DEVELOPER_GUIDE.md)
- [client_admin/DEVELOPER_NOTES.md](client_admin/DEVELOPER_NOTES.md)
- [server/DEVELOPER_NOTES.md](server/DEVELOPER_NOTES.md)
- [client_public/DEVELOPER_NOTES.md](client_public/DEVELOPER_NOTES.md)
- [client_native/README.md](client_native/README.md)

Read the area guide that matches the part of the repo you are changing. Link back to these docs instead of copying them into new instruction files or code comments.

## Repo Shape

- `server/` is the single API and static asset host. Treat it as the source of truth for data model, validation, and image/file serving behavior.
- `client_admin/` is the main web app and the canonical UX reference for feature work.
- `client_public/` is a lightweight public viewer that consumes the same API.
- `client_native/` is the active Expo native app. Use `client_admin/` plus `server/` as the parity reference.
- `mobile/` and `client_mobile/` are legacy/reference apps only unless the user explicitly asks to work there.

## Commands

### Root

- `npm run dev`: run `server/` and `client_admin/` together.
- `npm run build`: build `client_admin/`.
- `npm run build:full`: install root, server, and admin deps, then build admin.
- `npm run server`, `npm run admin`, `npm run public`, `npm run native`: app-specific shortcuts.

### server

- `npm run dev`: nodemon server.
- `npm start`: production server.
- `npm run data:import`, `npm run data:destroy`: seed helpers.
- `npm run personas:seed`, `npm run personas:clear`: persona seed helpers.
- `npm run strokes:seed`, `npm run strokes:clear`: strokes data helpers.
- `npm run diagnose`: deployment diagnostics.
- `npm run test` is a placeholder and should not be treated as real coverage.

### client_admin

- `npm run dev`: Vite dev server.
- `npm run build`: production build.
- `npm run lint`: repo-wide ESLint and often reports unrelated debt.
- Prefer targeted validation such as `npx eslint src/path/to/file.jsx` for changed files.

### client_public

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### client_native

- `npm start`: Expo dev server.
- `npm run android`, `npm run ios`, `npm run web`
- `npm run lint`
- `npm run typecheck`

## Working Rules

- Store DB image paths as relative paths like `/pokemon/...`, `/habborares/...`, or `/uploads/...`. Clients build absolute URLs from the API base.
- If you add or split Mongoose models, make sure `server/server.js` loads them. Missing model registration can look like a silent persistence bug.
- Never hardcode `localhost` in server redirects or OAuth flows. Use environment variables.
- In `client_admin/`, keep widgets small and focused. Move side effects and request logic into hooks or services when possible.
- Reuse the API client and auth patterns in `client_admin/src/services/api.js` instead of creating ad hoc request layers.
- In `client_public/`, keep command parsing simple and deterministic.
- For native parity work, use `client_admin/src/App.jsx`, `client_admin/src/pages/**`, `client_admin/src/services/**`, `server/routes/**`, and `server/controllers/**` as the implementation reference.

## Validation

- Validate the smallest relevant surface after each change.
- In `client_admin/`, prefer targeted ESLint runs on changed files because repo-wide lint has existing debt.
- In `client_native/`, run `npm run lint` and `npm run typecheck` when changing TypeScript or native app code.
- In `server/`, there is no meaningful built-in lint or test suite, so use targeted endpoint checks or domain scripts when relevant.

## Change Workflow

- When making a code change, update a changelog entry under `DEVNOTES/`.
- There is no canonical `DEVNOTES` changelog file yet. Before creating one, ask the user which target they want and offer options such as:
  1. `DEVNOTES/CHANGELOG.md` for a repo-wide log
  2. an area-specific changelog under `DEVNOTES/`
  3. updating an existing `DEVNOTES` document
- Unless the user specifies a different scheme, keep the major version at `4` and:
  - bump the third segment for small fixes or documentation updates
  - bump the second segment and reset the third for larger feature or workflow changes
- State the chosen version bump in the changelog entry.

## Collaboration Style

- When a decision would materially affect structure, naming, data shape, or UX, ask concise clarifying questions before editing.
- When there is room for customization, offer two or three concrete options with tradeoffs instead of silently choosing a default.
- Prefer linking to existing docs over duplicating large explanations.
## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
## Useful Entry Points

- [server/server.js](server/server.js)
- [client_admin/src/App.jsx](client_admin/src/App.jsx)
- [client_admin/src/services/api.js](client_admin/src/services/api.js)
- [client_admin/src/components/layout/AdminLayout.jsx](client_admin/src/components/layout/AdminLayout.jsx)
- [client_public/src/App.jsx](client_public/src/App.jsx)
- [client_native/App.tsx](client_native/App.tsx)
