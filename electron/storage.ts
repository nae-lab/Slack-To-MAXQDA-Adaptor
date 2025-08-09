const Store = require('electron-store')
import { createHash } from 'crypto'
import { machineIdSync } from 'node-machine-id'

export interface SlackTokenInfo {
  id: string;
  token: string;
  teamName: string;
  userName: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}

class SecureStorage {
  private store: any

  constructor() {
    const encryptionKey = this.getEncryptionKey()
    this.store = new Store({
      name: 'secure-storage',
      encryptionKey
    })
    
    // Migrate legacy token if exists
    this.migrateLegacyToken()
  }

  private getEncryptionKey(): string {
    try {
      const machineId = machineIdSync()
      return createHash('sha256').update(machineId + 'slack-exporter-salt').digest('hex')
    } catch {
      return createHash('sha256').update('fallback-key-slack-exporter').digest('hex')
    }
  }

  private migrateLegacyToken(): void {
    const legacyToken = this.store.get('slackToken')
    if (legacyToken) {
      // We'll migrate this when we get the token info from Slack API
      // For now, just keep it
    }
  }

  // New multi-token methods
  getSlackTokens(): SlackTokenInfo[] {
    return this.store.get('slackTokens', [])
  }

  addSlackToken(tokenInfo: SlackTokenInfo): void {
    const tokens = this.getSlackTokens()
    const existingIndex = tokens.findIndex(t => t.id === tokenInfo.id)
    
    if (existingIndex >= 0) {
      tokens[existingIndex] = tokenInfo
    } else {
      tokens.push(tokenInfo)
    }
    
    this.store.set('slackTokens', tokens)
  }

  removeSlackToken(tokenId: string): void {
    const tokens = this.getSlackTokens().filter(t => t.id !== tokenId)
    this.store.set('slackTokens', tokens)
    
    // If the removed token was selected, clear selection
    if (this.getSelectedTokenId() === tokenId) {
      this.setSelectedTokenId(null)
    }
  }

  getSelectedTokenId(): string | null {
    return this.store.get('selectedTokenId', null)
  }

  setSelectedTokenId(tokenId: string | null): void {
    this.store.set('selectedTokenId', tokenId)
  }

  getSelectedToken(): SlackTokenInfo | null {
    const selectedId = this.getSelectedTokenId()
    if (!selectedId) return null
    
    const tokens = this.getSlackTokens()
    return tokens.find(t => t.id === selectedId) || null
  }

  // Legacy methods for backward compatibility
  setSlackToken(token: string): void {
    if (!token) {
      this.store.delete('slackToken')
      return
    }
    this.store.set('slackToken', token)
  }

  getSlackToken(): string | null {
    // First try to get from selected token
    const selectedToken = this.getSelectedToken()
    if (selectedToken) {
      return selectedToken.token
    }
    
    // Fallback to legacy token
    return this.store.get('slackToken') || null
  }

  clearSlackToken(): void {
    this.store.delete('slackToken')
    this.store.delete("slackTokens");
    this.store.delete("selectedTokenId");
  }

  hasSlackToken(): boolean {
    const tokens = this.getSlackTokens();
    const legacyToken = this.store.get("slackToken");
    return tokens.length > 0 || !!legacyToken;
  }
}

export const secureStorage = new SecureStorage()