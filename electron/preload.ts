import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld("electronAPI", {
  exportSlack: (options: any) => ipcRenderer.invoke("export-slack", options),
  exportMultiple: (data: any) => ipcRenderer.invoke("export-multiple", data),
  getChannelName: (data: any) => ipcRenderer.invoke("get-channel-name", data),
  chooseDirectory: () => ipcRenderer.invoke("choose-directory"),
  saveFileDialog: (defaultFileName: string) =>
    ipcRenderer.invoke("save-file-dialog", defaultFileName),

  // Legacy token storage (for backward compatibility)
  storeSlackToken: (token: string) =>
    ipcRenderer.invoke("store-slack-token", token),
  getSlackToken: () => ipcRenderer.invoke("get-slack-token"),
  clearSlackToken: () => ipcRenderer.invoke("clear-slack-token"),
  hasSlackToken: () => ipcRenderer.invoke("has-slack-token"),

  // New multi-token management
  addSlackToken: (token: string) =>
    ipcRenderer.invoke("add-slack-token", token),
  getSlackTokens: () => ipcRenderer.invoke("get-slack-tokens"),
  selectSlackToken: (tokenId: string) =>
    ipcRenderer.invoke("select-slack-token", tokenId),
  removeSlackToken: (tokenId: string) =>
    ipcRenderer.invoke("remove-slack-token", tokenId),
  getSelectedToken: () => ipcRenderer.invoke("get-selected-token"),

  validateSlackToken: (token: string) =>
    ipcRenderer.invoke("validate-slack-token", token),
  getChannels: (token: string) => ipcRenderer.invoke("get-channels", token),

  onProgress: (callback: (progress: any) => void) => {
    const listener = (_: any, progress: any) => {
      callback(progress);
    };
    ipcRenderer.on("export-progress", listener);
    return () => ipcRenderer.removeListener("export-progress", listener);
  },
  onLog: (callback: (logEntry: any) => void) => {
    const listener = (_: any, logEntry: any) => {
      callback(logEntry);
    };
    ipcRenderer.on("export-log", listener);
    return () => ipcRenderer.removeListener("export-log", listener);
  },
});