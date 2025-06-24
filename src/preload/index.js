import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const customAPI = {
  // 🪟 Window frame actions
  sendFrameAction: (action) => {
    ipcRenderer.send('frame-action', action)
  },

  startIdleTracking: () => ipcRenderer.invoke('start-idle-tracking'),
  stopIdleTracking: () => ipcRenderer.invoke('stop-idle-tracking'),
  onIdleStart: (cb) => ipcRenderer.on('idle-start', (_, data) => cb(data)),
  onIdleEnd: (cb) => ipcRenderer.on('idle-end', (_, data) => cb(data)),
  offIdleStart: () => ipcRenderer.removeAllListeners('idle-start'),
  offIdleEnd: () => ipcRenderer.removeAllListeners('idle-end')
}

// ✅ Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ...customAPI
    })
  } catch (error) {
    console.error('Context bridge error:', error)
  }
} else {
  // Fallback (unsafe, dev only)
  window.electron = {
    ...electronAPI,
    ...customAPI
  }
}
