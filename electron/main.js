"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const slack_maxqda_adapter_1 = require("slack-maxqda-adapter");
const web_api_1 = require("@slack/web-api");
const storage_1 = require("./storage");
const crypto_1 = require("crypto");
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: (0, path_1.join)(__dirname, '../public/app-iconpng.png')
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.ipcMain.handle('export-slack', async (event, options) => {
    try {
        const adapter = new slack_maxqda_adapter_1.SlackMaxqdaAdapter({
            token: options.token,
            concurrency: options.concurrency || 4,
            onProgress: (progress) => {
                // Send progress update to renderer
                event.sender.send('export-progress', progress);
            },
            onLog: (logEntry) => {
                // Send log entry to renderer
                event.sender.send('export-log', logEntry);
            }
        });
        const result = await adapter.export({
            channelId: options.channelId,
            startDate: options.startDate,
            endDate: options.endDate || options.startDate,
            format: options.format,
            outputPath: options.outputPath
        });
        return { success: true, result };
    }
    catch (error) {
        console.error('Export error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('export-multiple', async (_, { token, exports, concurrency }) => {
    try {
        const adapter = new slack_maxqda_adapter_1.SlackMaxqdaAdapter({
            token,
            concurrency: concurrency || 4
        });
        const exportOptions = exports.map(exportConfig => ({
            channelId: exportConfig.channelId,
            startDate: exportConfig.startDate,
            endDate: exportConfig.endDate || exportConfig.startDate,
            format: exportConfig.format,
            outputPath: exportConfig.outputPath
        }));
        const results = await adapter.exportMultiple(exportOptions);
        return { success: true, results };
    }
    catch (error) {
        console.error('Export error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-channel-name', async (_, { token, channelId }) => {
    try {
        const client = new web_api_1.WebClient(token);
        const result = await client.conversations.info({
            channel: channelId
        });
        if (result.ok && result.channel) {
            return { success: true, channelName: result.channel.name };
        }
        return { success: false, error: 'Channel not found' };
    }
    catch (error) {
        console.error('Get channel name error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('choose-directory', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});
electron_1.ipcMain.handle('save-file-dialog', async (_, defaultFileName) => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultFileName,
        filters: [
            { name: 'Word Documents', extensions: ['docx'] },
            { name: 'Markdown Files', extensions: ['md'] }
        ]
    });
    if (!result.canceled) {
        return result.filePath;
    }
    return null;
});
// Secure token storage handlers
electron_1.ipcMain.handle('store-slack-token', async (_, token) => {
    try {
        storage_1.secureStorage.setSlackToken(token);
        return { success: true };
    }
    catch (error) {
        console.error('Error storing token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-slack-token', async () => {
    try {
        const token = storage_1.secureStorage.getSlackToken();
        return { success: true, token };
    }
    catch (error) {
        console.error('Error retrieving token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('clear-slack-token', async () => {
    try {
        storage_1.secureStorage.clearSlackToken();
        return { success: true };
    }
    catch (error) {
        console.error('Error clearing token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('has-slack-token', async () => {
    try {
        const hasToken = storage_1.secureStorage.hasSlackToken();
        return { success: true, hasToken };
    }
    catch (error) {
        console.error('Error checking token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('validate-slack-token', async (_, token) => {
    try {
        const client = new web_api_1.WebClient(token);
        const result = await client.auth.test();
        if (result.ok) {
            return {
                success: true,
                user: result.user,
                team: result.team,
                teamId: result.team_id,
                userId: result.user_id
            };
        }
        else {
            return { success: false, error: 'Invalid token' };
        }
    }
    catch (error) {
        console.error('Token validation error:', error);
        return { success: false, error: error.message };
    }
});
// Multi-token management handlers
electron_1.ipcMain.handle('add-slack-token', async (_, token) => {
    try {
        // First validate the token to get user/team info
        const client = new web_api_1.WebClient(token);
        const result = await client.auth.test();
        if (!result.ok) {
            return { success: false, error: 'Invalid token' };
        }
        // Create a unique ID for this token based on team and user
        const tokenId = (0, crypto_1.createHash)('sha256')
            .update(`${result.team_id}-${result.user_id}`)
            .digest('hex')
            .substring(0, 16);
        const tokenInfo = {
            id: tokenId,
            token,
            teamName: result.team || 'Unknown Team',
            userName: result.user || 'Unknown User',
            teamId: result.team_id || '',
            userId: result.user_id || '',
            createdAt: new Date()
        };
        storage_1.secureStorage.addSlackToken(tokenInfo);
        // If this is the first token, select it automatically
        const tokens = storage_1.secureStorage.getSlackTokens();
        if (tokens.length === 1) {
            storage_1.secureStorage.setSelectedTokenId(tokenId);
        }
        return { success: true, tokenInfo };
    }
    catch (error) {
        console.error('Error adding token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-slack-tokens', async () => {
    try {
        const tokens = storage_1.secureStorage.getSlackTokens();
        const selectedTokenId = storage_1.secureStorage.getSelectedTokenId();
        return { success: true, tokens, selectedTokenId };
    }
    catch (error) {
        console.error('Error retrieving tokens:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('select-slack-token', async (_, tokenId) => {
    try {
        storage_1.secureStorage.setSelectedTokenId(tokenId);
        return { success: true };
    }
    catch (error) {
        console.error('Error selecting token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('remove-slack-token', async (_, tokenId) => {
    try {
        storage_1.secureStorage.removeSlackToken(tokenId);
        return { success: true };
    }
    catch (error) {
        console.error('Error removing token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-selected-token', async () => {
    try {
        const selectedToken = storage_1.secureStorage.getSelectedToken();
        return { success: true, token: selectedToken?.token || null };
    }
    catch (error) {
        console.error('Error getting selected token:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('get-channels', async (_, token) => {
    try {
        const client = new web_api_1.WebClient(token);
        const channels = [];
        let cursor = undefined;
        // Fetch all public channels
        do {
            const result = await client.conversations.list({
                types: 'public_channel,private_channel',
                exclude_archived: true,
                limit: 200,
                cursor
            });
            if (result.ok && result.channels) {
                channels.push(...result.channels.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    isPrivate: channel.is_private,
                    memberCount: channel.num_members,
                    purpose: channel.purpose?.value || '',
                    topic: channel.topic?.value || ''
                })));
                cursor = result.response_metadata?.next_cursor;
            }
            else {
                break;
            }
        } while (cursor);
        return { success: true, channels };
    }
    catch (error) {
        console.error('Get channels error:', error);
        return { success: false, error: error.message };
    }
});
