const Store = require('electron-store')
import { createHash } from 'crypto'
import { machineIdSync } from 'node-machine-id'

interface StorageSchema {
  slackToken: string
}

class SecureStorage {
  private store: any

  constructor() {
    const encryptionKey = this.getEncryptionKey()
    this.store = new Store({
      name: 'secure-storage',
      encryptionKey
    })
  }

  private getEncryptionKey(): string {
    try {
      const machineId = machineIdSync()
      return createHash('sha256').update(machineId + 'slack-exporter-salt').digest('hex')
    } catch {
      return createHash('sha256').update('fallback-key-slack-exporter').digest('hex')
    }
  }

  setSlackToken(token: string): void {
    if (!token) {
      this.store.delete('slackToken')
      return
    }
    this.store.set('slackToken', token)
  }

  getSlackToken(): string | null {
    return this.store.get('slackToken') || null
  }

  clearSlackToken(): void {
    this.store.delete('slackToken')
  }

  hasSlackToken(): boolean {
    return this.store.has('slackToken')
  }
}

export const secureStorage = new SecureStorage()