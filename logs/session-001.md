# Session 001 — 2026-04-10

## Goal
Project scaffolding and infrastructure setup. Get the app to a runnable state.

## What was built
- `package.json` with electron + dotenv dependencies
- `.env` / `.env.example` for API key configuration
- `docs/ARCHITECTURE.md` — technical decisions document
- `docs/DEMO_SCRIPT.md` — recording script for MVP demo
- `qa/QA_CHECKLIST.md` — test checklist for all MVP requirements
- `qa/test-cases.md` — detailed test cases
- `logs/session-001.md` — this file
- `.claude/memory.md` — project state for AI agents

## What was fixed
- Moved `launcher.html` from project root into `src/` — `main.js` references `path.join(__dirname, 'launcher.html')` and `__dirname` is `src/`, so the file must be there

## What was tested
- `npm install` — dependencies installed successfully

## What is broken
- App has not been test-launched yet (human must run `npx electron .`)
- No `.env` with real API key yet

## What is next
- Human fills in `ANTHROPIC_API_KEY` in `.env`
- First test launch: `npx electron .`
- Verify launcher window appears and lists lessons
- Verify hotkey registration
- Verify overlay content protection (Zoom exclusion)
- Run through QA checklist
