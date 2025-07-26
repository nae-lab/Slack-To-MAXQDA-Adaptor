import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  exportSlack: (options: any) => ipcRenderer.invoke('export-slack', options),
  exportMultiple: (data: any) => ipcRenderer.invoke('export-multiple', data),
  getChannelName: (data: any) => ipcRenderer.invoke('get-channel-name', data),
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  saveFileDialog: (defaultFileName: string) => ipcRenderer.invoke('save-file-dialog', defaultFileName),
  onProgress: (callback: (progress: any) => void) => {
    const listener = (_: any, progress: any) => {
      callback(progress)
    }
    ipcRenderer.on('export-progress', listener)
    return () => ipcRenderer.removeListener('export-progress', listener)
  },
  onLog: (callback: (logEntry: any) => void) => {
    const listener = (_: any, logEntry: any) => {
      callback(logEntry)
    }
    ipcRenderer.on('export-log', listener)
    return () => ipcRenderer.removeListener('export-log', listener)
  }
})