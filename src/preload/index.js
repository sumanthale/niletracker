import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Store references to the event handlers for later removal
let idleStartHandler = null
let idleEndHandler = null

const customAPI = {
  // 🪟 Window frame actions
  sendFrameAction: (action) => {
    ipcRenderer.send('frame-action', action)
  },

  // ⏱ Start idle tracking
  startIdleTracking: () => ipcRenderer.invoke('start-idle-tracking'),

  // ⏹ Stop idle tracking
  stopIdleTracking: () => ipcRenderer.invoke('stop-idle-tracking'),

  // 🟡 Register idle-start listener
  onIdleStart: (callback) => {
    idleStartHandler = (_, time) => callback(time)
    ipcRenderer.on('idle-start', idleStartHandler)
  },

  // 🟢 Register idle-end listener
  onIdleEnd: (callback) => {
    idleEndHandler = (_, time) => callback(time)
    ipcRenderer.on('idle-end', idleEndHandler)
  },

  // 🔴 Remove idle-start listener
  offIdleStart: () => {
    if (idleStartHandler) {
      ipcRenderer.removeListener('idle-start', idleStartHandler)
      idleStartHandler = null
    }
  },

  // 🔴 Remove idle-end listener
  offIdleEnd: () => {
    if (idleEndHandler) {
      ipcRenderer.removeListener('idle-end', idleEndHandler)
      idleEndHandler = null
    }
  }
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
