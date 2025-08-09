"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureStorage = void 0;
const Store = require('electron-store');
const crypto_1 = require("crypto");
const node_machine_id_1 = require("node-machine-id");
class SecureStorage {
    constructor() {
        const encryptionKey = this.getEncryptionKey();
        this.store = new Store({
            name: 'secure-storage',
            encryptionKey
        });
        // Migrate legacy token if exists
        this.migrateLegacyToken();
    }
    getEncryptionKey() {
        try {
            const machineId = (0, node_machine_id_1.machineIdSync)();
            return (0, crypto_1.createHash)('sha256').update(machineId + 'slack-exporter-salt').digest('hex');
        }
        catch {
            return (0, crypto_1.createHash)('sha256').update('fallback-key-slack-exporter').digest('hex');
        }
    }
    migrateLegacyToken() {
        const legacyToken = this.store.get('slackToken');
        if (legacyToken) {
            // We'll migrate this when we get the token info from Slack API
            // For now, just keep it
        }
    }
    // New multi-token methods
    getSlackTokens() {
        return this.store.get('slackTokens', []);
    }
    addSlackToken(tokenInfo) {
        const tokens = this.getSlackTokens();
        const existingIndex = tokens.findIndex(t => t.id === tokenInfo.id);
        if (existingIndex >= 0) {
            tokens[existingIndex] = tokenInfo;
        }
        else {
            tokens.push(tokenInfo);
        }
        this.store.set('slackTokens', tokens);
    }
    removeSlackToken(tokenId) {
        const tokens = this.getSlackTokens().filter(t => t.id !== tokenId);
        this.store.set('slackTokens', tokens);
        // If the removed token was selected, clear selection
        if (this.getSelectedTokenId() === tokenId) {
            this.setSelectedTokenId(null);
        }
    }
    getSelectedTokenId() {
        return this.store.get('selectedTokenId', null);
    }
    setSelectedTokenId(tokenId) {
        this.store.set('selectedTokenId', tokenId);
    }
    getSelectedToken() {
        const selectedId = this.getSelectedTokenId();
        if (!selectedId)
            return null;
        const tokens = this.getSlackTokens();
        return tokens.find(t => t.id === selectedId) || null;
    }
    // Legacy methods for backward compatibility
    setSlackToken(token) {
        if (!token) {
            this.store.delete('slackToken');
            return;
        }
        this.store.set('slackToken', token);
    }
    getSlackToken() {
        // First try to get from selected token
        const selectedToken = this.getSelectedToken();
        if (selectedToken) {
            return selectedToken.token;
        }
        // Fallback to legacy token
        return this.store.get('slackToken') || null;
    }
    clearSlackToken() {
        this.store.delete('slackToken');
        this.store.delete('slackTokens');
        this.store.delete('selectedTokenId');
    }
    hasSlackToken() {
        const tokens = this.getSlackTokens();
        const legacyToken = this.store.get('slackToken');
        return tokens.length > 0 || !!legacyToken;
    }
}
exports.secureStorage = new SecureStorage();
