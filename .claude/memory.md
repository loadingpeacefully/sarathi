# Sārathi — Agent Memory

> Accumulated project decisions and current state. Read this at the start of every session.

## Current State (Session 001 — 2026-04-10)

### Repository Structure
All files from CLAUDE.md are present:
- `src/main.js` — Electron main process (complete)
- `src/sarathi.js` — Claude API client + lesson engine (complete)
- `src/overlay.html` — floating UI panel + response card + annotation canvas (complete)
- `src/launcher.html` — lesson selector (complete, moved from root to src/)
- `lessons/lesson1.json` — Fun Rainbow
- `lessons/lesson2.json` — Bird and Balloons
- `scripts/parse_lesson.py` — NOT YET CREATED
- `docs/PRD.docx` — exists
- `docs/ARCHITECTURE.md` — created session 001
- `docs/DEMO_SCRIPT.md` — created session 001

### Technical Decisions
1. **Raw HTTPS, no Anthropic SDK** — `sarathi.js` calls the API directly via Node `https` module. No `@anthropic-ai/sdk` dependency.
2. **Model: claude-sonnet-4-6** — set in `sarathi.js` line 19.
3. **No streaming in MVP** — single request/response for both options and follow-up calls.
4. **launcher.html lives in src/** — moved from root in session 001 because `main.js` uses `__dirname` which resolves to `src/`.

### Known Issues
- App has not been test-launched yet
- `scripts/parse_lesson.py` does not exist yet (lessons were pre-parsed)
- No `.gitignore` created yet
- No tray icon implemented yet (CLAUDE.md mentions "tray icon visible" in demo but code doesn't create one)

### What's Next
- Human fills in ANTHROPIC_API_KEY in .env
- First test launch
- Run QA checklist
- Fix any issues found in first launch
