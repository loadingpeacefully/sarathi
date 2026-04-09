# Sārathi — Architecture Decisions

## Overview

Sārathi is a 3-file Electron app: `main.js` (process management), `sarathi.js` (AI brain), `overlay.html` (UI). No frameworks, no bundlers, no build step.

## Key Decisions

### 1. Electron with no dock icon
- `app.dock.hide()` on Mac — Sārathi is a background utility, not a visible app
- Teacher interacts only via global hotkey and the overlay panel

### 2. Raw HTTPS for Anthropic API (no SDK)
- `sarathi.js` calls the Anthropic Messages API directly via Node `https`
- Avoids adding `@anthropic-ai/sdk` as a dependency — one fewer package to maintain
- Trade-off: no automatic retries or streaming helpers, but acceptable for MVP

### 3. Two windows: launcher + overlay
- **Launcher:** small frameless window for lesson selection at startup, then hidden
- **Overlay:** fullscreen transparent always-on-top window with `setContentProtection(true)`
- Overlay uses `setIgnoreMouseEvents(true, { forward: true })` for click-through, toggled when panel is active

### 4. desktopCapturer for screenshots
- Built into Electron — no extra permissions dialogs, no npm packages
- Captures at 1920x1080 regardless of actual screen size (NativeImage scales)
- Returns base64 PNG stripped of the data URI prefix before sending to Claude

### 5. Single-file UI (overlay.html)
- All CSS inline, all JS inline — no build step, no hot reload needed
- Panel, response card, and annotation canvas are all in one HTML file
- IPC messages from main process drive all state transitions

### 6. Annotation via canvas overlay
- Fullscreen transparent `<canvas>` with `pointer-events: none`
- Only circle annotations in MVP (`[CIRCLE:x,y,r]` tag parsed from Claude response)
- Circle: dashed stroke (#E8621A), fades after 7s, gone by 8s

### 7. Claude model: claude-sonnet-4-6
- Vision-capable, fast enough for live class use (~2-4s response time)
- System prompt is rebuilt per call with full lesson context injected

## File Responsibilities

| File | Role |
|------|------|
| `src/main.js` | App lifecycle, hotkey, screenshot, IPC, window management |
| `src/sarathi.js` | Claude API calls, system prompt, response parsing |
| `src/overlay.html` | All UI: panel, response card, annotation canvas |
| `src/launcher.html` | Lesson selector shown at startup |

## What We Intentionally Don't Have
- No React/Vue/frameworks
- No Tailwind/Bootstrap
- No build step or bundler
- No npm packages beyond electron + dotenv
- No multi-monitor support
- No streaming responses (MVP uses single request/response)
