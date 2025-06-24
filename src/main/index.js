import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let isTrackingIdle = false

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 460,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Window frame controls
  ipcMain.on('frame-action', (event, action) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return

    switch (action) {
      case 'MINIMIZE':
        win.minimize()
        break
      case 'MAXIMIZE':
        win.isMaximized() ? win.unmaximize() : win.maximize()
        break
      case 'CLOSE':
        win.close()
        break
    }
  })

  ipcMain.handle('start-idle-tracking', () => {
    if (isTrackingIdle) return
    isTrackingIdle = true

    if (!mainWindow) return

    powerMonitor.on('user-idle', () => {
      mainWindow.webContents.send('idle-start', new Date().toISOString())
    })

    powerMonitor.on('user-active', () => {
      mainWindow.webContents.send('idle-end', new Date().toISOString())
    })
  })

  // 🟢 Stop idle session tracking
  ipcMain.handle('stop-idle-tracking', () => {
    if (!isTrackingIdle) return
    isTrackingIdle = false
    powerMonitor.removeAllListeners('user-idle')
    powerMonitor.removeAllListeners('user-active')
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
})
// Stop idle tracking when app is closed
// app.on('before-quit', () => {
//   if (!isTrackingIdle) return
//   isTrackingIdle = false
//   powerMonitor.removeAllListeners('user-idle')
//   powerMonitor.removeAllListeners('user-active')
// })
// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
