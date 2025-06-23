import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ✅ Custom API: window controls + time tracking
const customAPI = {
  sendFrameAction: (action) => {
    ipcRenderer.send('frame-action', action)
  },

  // ⏱ Start tracking time
  startIdleTracking: () => ipcRenderer.invoke('start-idle-tracking'),

  // ⏹ Stop tracking time
  stopIdleTracking: () => ipcRenderer.invoke('stop-idle-tracking'),

  // 📊 Get tracked idle and working times
  getIdleAndWorkTime: () => ipcRenderer.invoke('get-idle-and-work-time')
}

// ✅ Expose the APIs to renderer
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
  window.electron = {
    ...electronAPI,
    ...customAPI
  }
}
