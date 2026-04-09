# Sārathi — QA Checklist

> Run through this after every session. Mark pass/fail with date.

## App Lifecycle

| # | Test | Status | Date |
|---|------|--------|------|
| 1 | App launches without errors | | |
| 2 | No dock icon on Mac | | |
| 3 | Launcher window appears at startup | | |
| 4 | Launcher lists available lessons from /lessons/ | | |
| 5 | Selecting a lesson and clicking "Start session" hides launcher | | |
| 6 | App stays alive after launcher is closed | | |

## Hotkey

| # | Test | Status | Date |
|---|------|--------|------|
| 7 | Cmd+Shift+Space registers successfully (check console log) | | |
| 8 | Hotkey triggers panel when lesson is loaded | | |
| 9 | Hotkey shows launcher if no lesson is loaded | | |
| 10 | Hotkey works while other apps are focused | | |

## Screenshot

| # | Test | Status | Date |
|---|------|--------|------|
| 11 | Screenshot captures current screen content | | |
| 12 | Screenshot is base64 PNG without data URI prefix | | |

## Panel & Options

| # | Test | Status | Date |
|---|------|--------|------|
| 13 | Loading state appears immediately after hotkey | | |
| 14 | 3 options appear within ~3 seconds | | |
| 15 | Options are contextual to what's on screen | | |
| 16 | Clicking an option sends it as a question | | |
| 17 | Keyboard 1/2/3 selects options | | |
| 18 | Open text input accepts custom question | | |
| 19 | Enter submits open text question | | |
| 20 | Escape dismisses panel | | |
| 21 | Panel auto-dismisses after 10 seconds | | |

## Response & Annotations

| # | Test | Status | Date |
|---|------|--------|------|
| 22 | Response card appears below panel | | |
| 23 | Response text is grounded in lesson content | | |
| 24 | Circle annotation appears when Claude includes [CIRCLE] tag | | |
| 25 | Circle is orange (#E8621A), dashed, 3px stroke | | |
| 26 | Circle fades after 7s, fully gone by 8s | | |
| 27 | [CIRCLE] tag is stripped from displayed text | | |

## Overlay Behavior

| # | Test | Status | Date |
|---|------|--------|------|
| 28 | Overlay is fullscreen transparent | | |
| 29 | Click-through works when panel is hidden | | |
| 30 | Click-through disabled when panel is shown | | |
| 31 | Click-through restored when panel is dismissed | | |

## Zoom Exclusion — CRITICAL

| # | Test | Status | Date |
|---|------|--------|------|
| 32 | setContentProtection(true) is called on overlay window | | |
| 33 | Overlay is NOT visible in Zoom screen share | | |
| 34 | Overlay is NOT visible in macOS screenshot (Cmd+Shift+3) | | |

## Error Handling

| # | Test | Status | Date |
|---|------|--------|------|
| 35 | Missing API key shows clear error | | |
| 36 | Network failure shows "couldn't reach the AI" message | | |
| 37 | Invalid lesson JSON shows error in launcher | | |
