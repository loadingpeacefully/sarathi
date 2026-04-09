/**
 * main.js — Sārathi Electron main process
 *
 * Responsibilities:
 *   - App lifecycle (no dock icon, lives in menu bar tray)
 *   - Tray icon with lesson selector menu
 *   - Global hotkey: Cmd+Shift+Space (Mac) / Ctrl+Shift+Space (Win)
 *   - Silent screenshot via desktopCapturer
 *   - Overlay window: fullscreen transparent, click-through, content-protected
 *   - IPC bridge between main and overlay renderer
 *
 * DO NOT run this file directly. Run: npx electron .
 */

// Catch crashes before anything else
process.on('uncaughtException', (err) => {
  require('fs').appendFileSync('sarathi-error.log', `[${new Date().toISOString()}] ${err.stack}\n`)
})

require('dotenv').config()

const {
  app,
  BrowserWindow,
  globalShortcut,
  desktopCapturer,
  ipcMain,
  screen,
  Tray,
  Menu,
  Notification
} = require('electron')

const path = require('path')
const sarathi = require('./sarathi')

let tray = null
let overlayWindow = null
let activeLessonJson = null
let activeLessonNumber = null
let lastScreenshotBase64 = null

// ─── APP LIFECYCLE ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  try {
    createTray()
    registerHotkey()
    console.log('Sārathi: App ready. Select a lesson from the menu bar icon.')
  } catch (err) {
    console.error('Sārathi: Startup error:', err)
    require('fs').appendFileSync('sarathi-error.log', `[${new Date().toISOString()}] Startup: ${err.stack}\n`)
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Prevent app from quitting when there are no windows
app.on('window-all-closed', (e) => {
  e.preventDefault()
})

// Extra safety: on macOS with dock hidden, the app can quit unexpectedly
app.on('before-quit', (e) => {
  // Only allow quit from the Quit menu item
  if (!app.isQuitting) {
    e.preventDefault()
  }
})

// ─── TRAY (replaces launcher window) ─────────────────────────────────────────

function createTray () {
  const iconPath = path.join(__dirname, '..', 'assets', 'iconTemplate.png')
  console.log('Sārathi: Creating tray with icon:', iconPath)
  tray = new Tray(iconPath)
  tray.setToolTip('Sārathi — AI teaching co-pilot')
  updateTrayMenu()
  console.log('Sārathi: Tray created. Look for the icon in your menu bar.')
}

function updateTrayMenu () {
  const lessons = sarathi.loadAvailableLessons()
  console.log('Sārathi: Found', lessons.length, 'lessons:', lessons.map(l => l.lessonJson.lesson_title))

  const lessonItems = lessons.map(({ lessonJson }, index) => {
    const label = `Lesson ${index + 1} — ${lessonJson.lesson_title}`
    return {
      label,
      type: 'radio',
      checked: activeLessonJson === lessonJson,
      click: () => selectLesson(lessonJson, index + 1)
    }
  })

  const template = [
    { label: 'Sārathi', enabled: false },
    { type: 'separator' },
    ...lessonItems,
    { type: 'separator' },
    {
      label: activeLessonNumber ? `Armed: Lesson ${activeLessonNumber}` : 'No lesson loaded',
      enabled: false
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } }
  ]

  tray.setContextMenu(Menu.buildFromTemplate(template))
}

function selectLesson (lessonJson, lessonNum) {
  activeLessonJson = lessonJson
  activeLessonNumber = lessonNum
  console.log(`Sārathi: Lesson ${lessonNum} loaded — ${lessonJson.lesson_title}`)

  if (!overlayWindow) {
    createOverlayWindow()
  }

  updateTrayMenu()

  if (Notification.isSupported()) {
    new Notification({
      title: 'Sārathi ready',
      body: `Lesson ${lessonNum} loaded`,
      silent: true
    }).show()
  }
}

// ─── OVERLAY WINDOW ───────────────────────────────────────────────────────────

function createOverlayWindow () {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.size

  console.log(`Sārathi: Creating overlay — ${width}x${height}`)

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'))

  // CRITICAL: Exclude from Zoom screen share and all screen capture
  overlayWindow.setContentProtection(true)

  // Don't steal focus from whatever app the teacher is using
  overlayWindow.setFocusable(false)

  setOverlayClickThrough(true)

  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('Sārathi: Overlay loaded and ready.')
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

// ─── CLICK-THROUGH MANAGEMENT ─────────────────────────────────────────────────

function setOverlayClickThrough (isClickThrough) {
  if (!overlayWindow) return
  overlayWindow.setIgnoreMouseEvents(isClickThrough, { forward: true })
}

// ─── GLOBAL HOTKEY ────────────────────────────────────────────────────────────

function registerHotkey () {
  const hotkey = process.platform === 'darwin'
    ? 'Command+Shift+Space'
    : 'Control+Shift+Space'

  const registered = globalShortcut.register(hotkey, async () => {
    await onHotkeyPressed()
  })

  if (!registered) {
    console.error(`Sārathi: Failed to register hotkey ${hotkey}. It may be in use by another app.`)
  } else {
    console.log(`Sārathi: Hotkey ${hotkey} registered.`)
  }
}

// ─── HOTKEY HANDLER ───────────────────────────────────────────────────────────

async function onHotkeyPressed () {
  console.log('Sārathi: Hotkey pressed.', { hasLesson: !!activeLessonJson, hasOverlay: !!overlayWindow })
  if (!activeLessonJson || !overlayWindow) return

  try {
    // Ensure overlay is in forwarding mode so renderer can detect mouse over panel
    overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    overlayWindow.setFocusable(true)

    lastScreenshotBase64 = await captureScreen()
    console.log('Sārathi: Screenshot captured, length:', lastScreenshotBase64.length)

    // Get cursor position to show panel near it
    const cursorPoint = screen.getCursorScreenPoint()
    console.log('Sārathi: Cursor at', cursorPoint.x, cursorPoint.y)

    overlayWindow.webContents.send('show-loading', { cursorX: cursorPoint.x, cursorY: cursorPoint.y })

    const { options } = await sarathi.generateOptions(lastScreenshotBase64, activeLessonJson)

    overlayWindow.webContents.send('show-panel', {
      options,
      cursorX: cursorPoint.x,
      cursorY: cursorPoint.y
    })

  } catch (err) {
    console.error('Sārathi: Error generating options:', err)
    overlayWindow.webContents.send('show-error', {
      message: "Sārathi couldn't reach the AI — check your connection."
    })
  }
}

// ─── SCREENSHOT ───────────────────────────────────────────────────────────────

async function captureScreen () {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  })

  if (!sources || sources.length === 0) {
    throw new Error('No screen sources found')
  }

  const base64 = sources[0].thumbnail.toDataURL()
  return base64.replace(/^data:image\/\w+;base64,/, '')
}

// ─── IPC HANDLERS ─────────────────────────────────────────────────────────────

ipcMain.on('submit-question', async (event, { question }) => {
  if (!activeLessonJson || !lastScreenshotBase64) {
    if (overlayWindow) {
      overlayWindow.webContents.send('show-error', {
        message: 'No screenshot available. Press the hotkey first.'
      })
    }
    return
  }

  try {
    const { responseText, pointTag } = await sarathi.askFollowup(
      question,
      lastScreenshotBase64,
      activeLessonJson
    )

    overlayWindow.webContents.send('show-response', { text: responseText })

    if (pointTag) {
      overlayWindow.webContents.send('draw-pointer', pointTag)
    }

  } catch (err) {
    console.error('Sārathi: Error in follow-up:', err)
    overlayWindow.webContents.send('show-error', {
      message: "Sārathi couldn't reach the AI — check your connection."
    })
  }
})

ipcMain.on('dismiss-panel', () => {
  if (overlayWindow) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    overlayWindow.setFocusable(false)
    overlayWindow.webContents.send('clear')
  }
})

// Renderer tells us when mouse is over UI vs empty overlay
ipcMain.on('set-click-through', (event, isClickThrough) => {
  if (!overlayWindow) return
  overlayWindow.setIgnoreMouseEvents(isClickThrough, { forward: true })
})
