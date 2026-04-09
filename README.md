# Sarathi

**The teacher's silent co-pilot.** An AI-powered desktop overlay that whispers strategy to BrightChamps teachers during live 1:1 classes — completely invisible to students on screen share.

[**View Landing Page**](https://loadingpeacefully.github.io/sarathi/) | [**Watch Demo**](https://github.com/loadingpeacefully/sarathi/releases/tag/v0.1.0)

---

## What it does

Teacher presses a hotkey during class. Sarathi silently screenshots whatever is on screen — slides, code editor, browser — sends it to Claude's vision model with the loaded lesson plan as context, and shows a floating panel with 3 smart suggestions. The teacher picks one, gets a concise answer, and moves on. The student never sees any of it.

```
Teacher's screen                    Student's screen (Zoom)
+---------------------------+       +---------------------------+
|                           |       |                           |
|   [code.org editor]       |       |   [code.org editor]       |
|                           |       |                           |
|            +----------+   |       |                           |
|            | Sarathi   |   |       |       (nothing here)      |
|            | 1. Fix... |   |       |                           |
|            | 2. Exp... |   |       |                           |
|            | 3. Poi... |   |       |                           |
|            +----------+   |       |                           |
+---------------------------+       +---------------------------+
```

## Key features

- **Vision-powered** — sees the teacher's screen in real-time via Claude's vision model
- **Lesson-grounded** — every response anchored to the loaded lesson plan (no hallucination)
- **Multi-turn memory** — follow-up questions without re-triggering the hotkey
- **Screen share safe** — OS-level content protection (`setContentProtection`), not a CSS trick
- **Visual pointer** — ask "point to the error" and a purple cursor appears on the element
- **2-second response** — from hotkey to options on screen

## Run it

```bash
# 1. Clone and install
git clone https://github.com/loadingpeacefully/sarathi.git
cd sarathi
npm install

# 2. Add your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Launch
npx electron .
```

Select a lesson from the menu bar icon, then press **Cmd+Shift+Space** (Mac) or **Ctrl+Shift+Space** (Windows) during class.

## Architecture

```
sarathi/
├── src/
│   ├── main.js          ← Electron: tray menu, hotkey, screenshot, IPC
│   ├── sarathi.js       ← Claude vision API + lesson context + conversation memory
│   └── overlay.html     ← Floating panel UI + pointer canvas + state machine
├── lessons/
│   ├── lesson1.json     ← App Development (coding)
│   ├── lesson2.json     ← App Development (coding)
│   └── lesson3.json     ← Place Value of Digits (math)
├── assets/
│   └── iconTemplate.png ← Menu bar tray icon
└── docs/
    └── index.html       ← Landing page (GitHub Pages)
```

**3 source files. 0 frameworks. 2 npm dependencies** (electron + dotenv).

All Claude calls go through `sarathi.js`. The overlay is a single HTML file with inline CSS/JS and a state machine: `hidden → loading → options → thinking → response → error`. The panel follows the cursor, is draggable, and uses smart click-through so apps beneath remain interactive.

## How it works

1. **Hotkey** → `main.js` captures screenshot via `desktopCapturer` (1920x1080)
2. **Options** → `sarathi.js` sends screenshot + lesson context to Claude, gets 3 suggestions
3. **Response** → teacher picks one or types a question, Claude responds grounded in the lesson
4. **Pointer** → if Claude identifies an element, `[POINT:x,y]` tag draws a purple cursor on the overlay canvas
5. **Invisible** → `overlayWindow.setContentProtection(true)` excludes the window from all screen capture APIs

## Lessons

Lesson JSON files follow this schema:

```json
{
  "lesson_title": "Place Value of Digits",
  "topics_covered": "Place value, comparing numbers",
  "objective": "Understand how digit value depends on position",
  "tool": "BrightChamps Math Platform",
  "duration_mins": 55,
  "concept_definitions": [{ "concept": "...", "definition": "..." }],
  "warmup_qa": [{ "q": "...", "a": "..." }],
  "checkpoint_qa": [{ "q": "...", "a": "...", "marks": 2 }],
  "common_errors": ["..."]
}
```

Add a new lesson: drop a `.json` file in `lessons/` — it appears in the tray menu automatically.

## Tech stack

| Component | Choice | Why |
|-----------|--------|-----|
| Desktop app | Electron | Cross-platform, `desktopCapturer` built-in, `setContentProtection` for screen share exclusion |
| AI | Claude Sonnet (vision) | Fast enough for live class, vision-capable, follows system prompts precisely |
| API | Raw `https` module | No SDK dependency, keeps the app at 2 npm packages total |
| UI | Vanilla HTML/CSS/JS | No build step, no bundler, instant iteration |

## License

Internal prototype. Not for distribution.

---

*Named after Krishna's role as Arjuna's charioteer (sarathi) in the Mahabharata — the strategist who never entered the battlefield himself, but whispered the moves that changed everything.*
