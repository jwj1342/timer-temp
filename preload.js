const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('electronAPI', {
  openPlayerAWindow: () => ipcRenderer.invoke('open-player-a-window'),
  openPlayerBWindow: () => ipcRenderer.invoke('open-player-b-window'),
  openInterviewWindow: () => ipcRenderer.invoke('open-interview-window'),
  openBothPlayerWindows: () => ipcRenderer.invoke('open-both-player-windows')
})