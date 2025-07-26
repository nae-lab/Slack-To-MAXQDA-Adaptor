import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { SlackMaxqdaAdapter } from 'slack-maxqda-adapter'
import { WebClient } from '@slack/web-api'
import { secureStorage } from './storage'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: join(__dirname, '../public/icon.png')
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.handle('export-slack', async (event, options) => {
  try {
    const adapter = new SlackMaxqdaAdapter({
      token: options.token,
      concurrency: options.concurrency || 4,
      onProgress: (progress) => {
        // Send progress update to renderer
        event.sender.send('export-progress', progress)
      },
      onLog: (logEntry) => {
        // Send log entry to renderer
        event.sender.send('export-log', logEntry)
      }
    })
    
    const result = await adapter.export({
      channelId: options.channelId,
      startDate: options.startDate,
      endDate: options.endDate || options.startDate,
      format: options.format,
      outputPath: options.outputPath
    })
    
    return { success: true, result }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('export-multiple', async (_, { token, exports, concurrency }) => {
  try {
    const adapter = new SlackMaxqdaAdapter({
      token,
      concurrency: concurrency || 4
    })
    
    const exportOptions = exports.map(exportConfig => ({
      channelId: exportConfig.channelId,
      startDate: exportConfig.startDate,
      endDate: exportConfig.endDate || exportConfig.startDate,
      format: exportConfig.format,
      outputPath: exportConfig.outputPath
    }))
    
    const results = await adapter.exportMultiple(exportOptions)
    
    return { success: true, results }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-channel-name', async (_, { token, channelId }) => {
  try {
    const client = new WebClient(token)
    const result = await client.conversations.info({
      channel: channelId
    })
    
    if (result.ok && result.channel) {
      return { success: true, channelName: result.channel.name }
    }
    
    return { success: false, error: 'Channel not found' }
  } catch (error) {
    console.error('Get channel name error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('choose-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory']
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('save-file-dialog', async (_, defaultFileName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultFileName,
    filters: [
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'Markdown Files', extensions: ['md'] }
    ]
  })
  
  if (!result.canceled) {
    return result.filePath
  }
  return null
})

// Secure token storage handlers
ipcMain.handle('store-slack-token', async (_, token: string) => {
  try {
    secureStorage.setSlackToken(token)
    return { success: true }
  } catch (error) {
    console.error('Error storing token:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-slack-token', async () => {
  try {
    const token = secureStorage.getSlackToken()
    return { success: true, token }
  } catch (error) {
    console.error('Error retrieving token:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('clear-slack-token', async () => {
  try {
    secureStorage.clearSlackToken()
    return { success: true }
  } catch (error) {
    console.error('Error clearing token:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('has-slack-token', async () => {
  try {
    const hasToken = secureStorage.hasSlackToken()
    return { success: true, hasToken }
  } catch (error) {
    console.error('Error checking token:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('validate-slack-token', async (_, token: string) => {
  try {
    const client = new WebClient(token)
    const result = await client.auth.test()
    
    if (result.ok) {
      return { 
        success: true, 
        user: result.user,
        team: result.team,
        teamId: result.team_id,
        userId: result.user_id
      }
    } else {
      return { success: false, error: 'Invalid token' }
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-channels', async (_, token: string) => {
  try {
    const client = new WebClient(token)
    const channels = []
    let cursor = undefined
    
    // Fetch all public channels
    do {
      const result = await client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 200,
        cursor
      })
      
      if (result.ok && result.channels) {
        channels.push(...result.channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private,
          memberCount: channel.num_members,
          purpose: channel.purpose?.value || '',
          topic: channel.topic?.value || ''
        })))
        cursor = result.response_metadata?.next_cursor
      } else {
        break
      }
    } while (cursor)
    
    return { success: true, channels }
  } catch (error) {
    console.error('Get channels error:', error)
    return { success: false, error: error.message }
  }
})