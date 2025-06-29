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
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
       backgroundThrottling: false // 🛑 disables Chromium throttling
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Window frame controls
  ipcMain.on('frame-action', (event, action) => {
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
  let isTrackingIdle = false
  let idlePollingInterval = null
  let wasIdle = false

  ipcMain.handle('start-idle-tracking', () => {
    console.log('🟡 start-idle-tracking invoked')
    if (isTrackingIdle) return
    isTrackingIdle = true

    const idleThreshold = 60 // seconds

    idlePollingInterval = setInterval(() => {
      const idleSeconds = powerMonitor.getSystemIdleTime()

      if (idleSeconds >= idleThreshold && !wasIdle) {
        wasIdle = true
        console.log('⛔ User is idle')
        mainWindow.webContents.send('idle-start', new Date().toISOString())
      } else if (idleSeconds < idleThreshold && wasIdle) {
        wasIdle = false
        console.log('🟢 User is active again')
        mainWindow.webContents.send('idle-end', new Date().toISOString())
      }
    }, 5000) // poll every 5s
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
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: {
            width: width, //reduce to 50% Capture half the width
            height: height // Capture half the height
          }
        })
        const screenSource = sources.find(
          (src) => src.name === 'Entire Screen' || src.name === 'Screen 1'
        )

        if (!screenSource) {
          console.warn('No screen source found')
          return
        }
        const jpegBuffer = screenSource.thumbnail.toJPEG(50) // 50 = compression quality (0–100)
        const base64 = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
        mainWindow.webContents.send('screenshot-taken', {
          timestamp: new Date().toISOString(),
          image: base64
        })
      },
      10 * 60 * 1000
    ) // every 60 seconds
  })

  ipcMain.handle('stop-screenshot-capture', () => {
    console.log('⛔ Screenshot capture stopped')
    if (screenshotInterval) {
      clearInterval(screenshotInterval)
      screenshotInterval = null
    }
  })
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide() // Hide instead of closing
  })
  // External links
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load app (dev/prod)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
let tray = null

// App ready
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  tray = new Tray(path.join(__dirname, '../../resources/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip('Time Tracker')
  tray.setContextMenu(contextMenu)
})

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
})
