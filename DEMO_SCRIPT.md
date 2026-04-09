# Sārathi — Demo Recording Script

> Record this in one continuous take. No cuts, no edits.

## Setup (before recording)

1. Sārathi is running (`npm start` already executed)
2. Lesson 1 (Fun Rainbow) is selected in the launcher
3. Zoom is open and screen sharing is active (to prove overlay is invisible)
4. Browser tab open to code.org Sprite Lab
5. Lesson slides (Fun Rainbow) open in another tab or window

## Recording Script

### Scene 1: Lesson Slides (0:00–0:30)

1. Show the lesson slides on screen (Fun Rainbow - slide with setTimeout concept)
2. Press `Cmd+Shift+Space`
3. **Expected:** Panel appears top-right within 2 seconds with 3 context-aware options
4. Pause briefly to show the options are relevant to the slide content
5. Click option 1 (or whichever is most relevant)
6. **Expected:** Response streams in below the panel, grounded in lesson content
7. Press `Escape` to dismiss

### Scene 2: Code Editor (0:30–1:15)

1. Switch to code.org tab showing student code
2. Press `Cmd+Shift+Space`
3. **Expected:** New panel with options relevant to the code on screen (not the previous slide)
4. Type a custom question in the open text field: "What's wrong with this setTimeout?"
5. Press `Enter` to submit
6. **Expected:** Response appears explaining the issue + orange circle drawn on the problematic code element
7. **Expected:** Circle fades after ~8 seconds
8. Press `Escape` to dismiss

### Scene 3: Zoom Proof (1:15–1:30)

1. Show the Zoom window — confirm that the Sārathi overlay is NOT visible in the shared screen
2. Press `Cmd+Shift+Space` one more time while Zoom is sharing
3. **Expected:** Panel visible on teacher's actual screen, invisible in Zoom share

## Key Points to Demonstrate

- [ ] Panel appears within 2 seconds of hotkey
- [ ] Options are contextual (different for slides vs code editor)
- [ ] Open text field works
- [ ] Circle annotation appears and fades
- [ ] Overlay is invisible on Zoom screen share
- [ ] Teacher can interact with apps beneath the overlay when panel is dismissed

## If Something Goes Wrong

- **Panel doesn't appear:** Check console for hotkey registration error
- **"Couldn't reach AI" error:** Check .env has valid ANTHROPIC_API_KEY
- **Circle in wrong position:** Known limitation — Claude estimates coordinates from screenshot
- **Overlay visible in Zoom:** STOP. This is a critical bug. Do not ship.
