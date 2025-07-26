import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  exportSlack: (options: any) => ipcRenderer.invoke('export-slack', options),
  exportMultiple: (data: any) => ipcRenderer.invoke('export-multiple', data),
  getChannelName: (data: any) => ipcRenderer.invoke('get-channel-name', data),
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  saveFileDialog: (defaultFileName: string) => ipcRenderer.invoke('save-file-dialog', defaultFileName)
})