# Sārathi — Test Cases

## TC-01: First Launch Flow

**Precondition:** App not running, .env has valid API key, lessons/ has at least one JSON file.

1. Run `npx electron .`
2. **Verify:** Launcher window appears (380x260), titled "Sārathi"
3. **Verify:** No dock icon appears on Mac
4. **Verify:** Dropdown lists lessons by title (e.g., "Fun Rainbow — Event blocks, setTimeout blocks")
5. Select Lesson 1, click "Start session"
6. **Verify:** Launcher hides
7. **Verify:** Console shows "Sārathi: Lesson loaded — Fun Rainbow"
8. **Verify:** Hotkey console message: "Sārathi: Hotkey Cmd+Shift+Space registered."

## TC-02: Hotkey → Options on Slide

**Precondition:** Lesson loaded, lesson slide visible on screen.

1. Press `Cmd+Shift+Space`
2. **Verify:** Panel appears top-right with "Sārathi is looking at your screen…" loading text
3. **Verify:** Within ~3s, loading text replaced by 3 option buttons
4. **Verify:** Options are specific to the slide content (not generic)
5. **Verify:** Open text input is focused and ready for typing

## TC-03: Hotkey → Options on Code Editor

**Precondition:** Lesson loaded, code.org editor visible on screen.

1. Press `Cmd+Shift+Space`
2. **Verify:** Panel appears with 3 options relevant to the code on screen
3. **Verify:** Options differ from TC-02 (context-aware, not static)

## TC-04: Select Option → Response

**Precondition:** Panel visible with 3 options.

1. Click option 1 (or press `1`)
2. **Verify:** Panel dismisses
3. **Verify:** Response card appears with text from Claude
4. **Verify:** Response is concise (1-3 sentences) and grounded in lesson
5. **Verify:** No "Great question!" or student-facing language

## TC-05: Open Text → Response with Circle

**Precondition:** Panel visible, code.org editor on screen with a visible error.

1. Type "What's wrong with this code?" in the open text field
2. Press `Enter`
3. **Verify:** Panel dismisses
4. **Verify:** Response card appears with explanation
5. **Verify:** Orange dashed circle appears on screen near the error
6. **Verify:** Circle: #E8621A, 3px stroke, dashed [8,4]
7. Wait 7 seconds
8. **Verify:** Circle begins fading
9. Wait 1 more second
10. **Verify:** Circle is fully gone

## TC-06: Escape Dismisses Everything

**Precondition:** Panel and/or response card visible.

1. Press `Escape`
2. **Verify:** Panel hidden
3. **Verify:** Response card hidden
4. **Verify:** Canvas cleared (no circles)
5. **Verify:** Click-through restored (can click apps beneath overlay)

## TC-07: Auto-Dismiss Timer

**Precondition:** Panel visible with options.

1. Do nothing for 10 seconds
2. **Verify:** Panel auto-dismisses
3. **Verify:** Click-through restored

## TC-08: Zoom Screen Share Exclusion

**Precondition:** Zoom running, screen sharing active.

1. Press `Cmd+Shift+Space` — panel appears on teacher's screen
2. **Verify:** Panel is NOT visible in Zoom's shared screen preview
3. **Verify:** Panel is NOT visible to a remote Zoom participant
4. Take a macOS screenshot (`Cmd+Shift+3`)
5. **Verify:** Overlay is NOT captured in the screenshot

## TC-09: Click-Through Behavior

**Precondition:** Overlay running, no panel visible.

1. Click on any app beneath the overlay
2. **Verify:** Click passes through — app receives the click
3. Press `Cmd+Shift+Space` — panel appears
4. Click a panel button
5. **Verify:** Panel receives the click (not passed through)
6. Dismiss panel
7. Click on app beneath overlay again
8. **Verify:** Click passes through again

## TC-10: No Lesson Loaded → Hotkey Shows Launcher

**Precondition:** App just launched, no lesson selected yet, launcher is visible.

1. Close the launcher window
2. Press `Cmd+Shift+Space`
3. **Verify:** Launcher window reappears (or nothing happens if launcher was destroyed — see TC edge case)

## TC-11: Missing API Key

**Precondition:** `.env` has no ANTHROPIC_API_KEY or key is empty.

1. Load a lesson, press `Cmd+Shift+Space`
2. **Verify:** Error message appears: "Sārathi couldn't reach the AI — check your connection." (or similar)
3. **Verify:** App does not crash

## TC-12: Network Failure

**Precondition:** Valid API key, but internet disconnected.

1. Load a lesson, press `Cmd+Shift+Space`
2. **Verify:** Loading state appears
3. **Verify:** After timeout, error message appears in panel
4. **Verify:** App does not crash, hotkey still works after reconnecting
