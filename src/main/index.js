import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  powerMonitor,
  desktopCapturer,
  screen,
  Tray,
  Menu
} from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let screenshotInterval = null
let idlePollingInterval = null
let mainWindow = null
let tray = null
let systemSleepStartedAt = null
let lockStartedAt = null
let isTrackingIdle = false
let wasIdle = false
const COMPRESSION_QUALITY = 50
const IDLE_THRESHOLD = 60 // seconds

function setupPowerMonitorEvents() {
  powerMonitor.on('suspend', () => {
    systemSleepStartedAt = Date.now()
    console.log('💤 System is suspending')
    if (!wasIdle) {
      wasIdle = true
      mainWindow?.webContents.send('idle-start', new Date(systemSleepStartedAt).toISOString())
    }
  })

  powerMonitor.on('resume', () => {
    const resumeTime = Date.now()
    console.log('🔋 System has resumed')
    if (systemSleepStartedAt) {
      const sleepDurationSeconds = Math.floor((resumeTime - systemSleepStartedAt) / 1000)
      if (sleepDurationSeconds >= IDLE_THRESHOLD) {
        mainWindow?.webContents.send('idle-end', new Date(resumeTime).toISOString())
        wasIdle = false
      }
      systemSleepStartedAt = null
    }
  })

  powerMonitor.on('lock-screen', () => {
    console.log('🔒 Screen locked')
    if (!wasIdle) {
      wasIdle = true
      lockStartedAt = Date.now()
      mainWindow?.webContents.send('idle-start', new Date(lockStartedAt).toISOString())
    }
  })

  powerMonitor.on('unlock-screen', () => {
    console.log('🔓 Screen unlocked')
    if (wasIdle) {
      mainWindow?.webContents.send('idle-end', new Date().toISOString())
      wasIdle = false
      lockStartedAt = null
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 670,
    minWidth: 460,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('show', () => {
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  })

  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    clearInterval(screenshotInterval)
    clearInterval(idlePollingInterval)
    screenshotInterval = null
    idlePollingInterval = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  ipcMain.on('frame-action', (_, action) => {
    if (!mainWindow) return
    switch (action) {
      case 'MINIMIZE':
        mainWindow.minimize()
        break
      case 'MAXIMIZE':
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
        break
      case 'CLOSE':
        mainWindow.hide()
        break
    }
  })

  ipcMain.handle('start-idle-tracking', () => {
    console.log('🟡 start-idle-tracking invoked')
    if (isTrackingIdle) return
    isTrackingIdle = true

    idlePollingInterval = setInterval(() => {
      const idleSeconds = powerMonitor.getSystemIdleTime()
      if (idleSeconds >= IDLE_THRESHOLD && !wasIdle) {
        wasIdle = true
        console.log('⛔ User is idle')
        mainWindow?.webContents.send('idle-start', new Date().toISOString())
      } else if (idleSeconds < IDLE_THRESHOLD && wasIdle) {
        wasIdle = false
        console.log('🟢 User is active again')
        mainWindow?.webContents.send('idle-end', new Date().toISOString())
      }
    }, 5000)
  })

  ipcMain.handle('stop-idle-tracking', () => {
    console.log('⛔ stop-idle-tracking invoked')
    if (!isTrackingIdle) return
    isTrackingIdle = false
    clearInterval(idlePollingInterval)
    idlePollingInterval = null
    wasIdle = false
  })

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size

  ipcMain.handle('start-screenshot-capture', async () => {
    console.log('📸 Screenshot capture started')
    if (screenshotInterval) return

    screenshotInterval = setInterval(
      async () => {
        console.log('⏱️ Taking screenshot...')

        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width, height }
        })
        console.log(
          '🔍 Sources:',
          sources.map((s) => s.name)
        )

        const screenSource = sources.find((src) => src.name.includes('Screen')) || sources[0]

        if (!screenSource || screenSource.thumbnail.isEmpty()) {
          console.warn('❌ No valid screen source found or empty thumbnail')
          return
        }

        const jpegBuffer = screenSource.thumbnail.toJPEG(COMPRESSION_QUALITY)
        const base64 = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`

        mainWindow?.webContents.send('screenshot-taken', {
          timestamp: new Date().toISOString(),
          image: base64
        })
      },
      10 * 60 * 1000
    )

    // every 10 minutes
  })

  ipcMain.handle('stop-screenshot-capture', () => {
    console.log('⛔ Screenshot capture stopped')
    if (screenshotInterval) {
      clearInterval(screenshotInterval)
      screenshotInterval = null
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 🚨 SINGLE INSTANCE LOCK: Prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    app.isQuiting = false
    electronApp.setAppUserModelId('com.electron')
    setupPowerMonitorEvents()

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    ipcMain.on('ping', () => console.log('pong'))

    createWindow()

    // 🔔 Tray setup
    tray = new Tray(path.join(__dirname, '../../resources/icon.png'))
    tray.setToolTip('Time Tracker')
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow?.show() },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true
          app.quit()
        }
      }
    ])
    tray.setContextMenu(contextMenu)

    // 👆 Clicking the tray icon shows the app
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    // macOS dock behavior
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else mainWindow?.show()
    })
  })
}

// Close behavior
app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
})
