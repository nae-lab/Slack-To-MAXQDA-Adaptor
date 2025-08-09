"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    exportSlack: (options) => electron_1.ipcRenderer.invoke('export-slack', options),
    exportMultiple: (data) => electron_1.ipcRenderer.invoke('export-multiple', data),
    getChannelName: (data) => electron_1.ipcRenderer.invoke('get-channel-name', data),
    chooseDirectory: () => electron_1.ipcRenderer.invoke('choose-directory'),
    saveFileDialog: (defaultFileName) => electron_1.ipcRenderer.invoke('save-file-dialog', defaultFileName),
    // Legacy token storage (for backward compatibility)
    storeSlackToken: (token) => electron_1.ipcRenderer.invoke('store-slack-token', token),
    getSlackToken: () => electron_1.ipcRenderer.invoke('get-slack-token'),
    clearSlackToken: () => electron_1.ipcRenderer.invoke('clear-slack-token'),
    hasSlackToken: () => electron_1.ipcRenderer.invoke('has-slack-token'),
    // New multi-token management
    addSlackToken: (token) => electron_1.ipcRenderer.invoke('add-slack-token', token),
    getSlackTokens: () => electron_1.ipcRenderer.invoke('get-slack-tokens'),
    selectSlackToken: (tokenId) => electron_1.ipcRenderer.invoke('select-slack-token', tokenId),
    removeSlackToken: (tokenId) => electron_1.ipcRenderer.invoke('remove-slack-token', tokenId),
    getSelectedToken: () => electron_1.ipcRenderer.invoke('get-selected-token'),
    validateSlackToken: (token) => electron_1.ipcRenderer.invoke('validate-slack-token', token),
    getChannels: (token) => electron_1.ipcRenderer.invoke('get-channels', token),
    onProgress: (callback) => {
        const listener = (_, progress) => {
            callback(progress);
        };
        electron_1.ipcRenderer.on('export-progress', listener);
        return () => electron_1.ipcRenderer.removeListener('export-progress', listener);
    },
    onLog: (callback) => {
        const listener = (_, logEntry) => {
            callback(logEntry);
        };
        electron_1.ipcRenderer.on('export-log', listener);
        return () => electron_1.ipcRenderer.removeListener('export-log', listener);
    }
});
