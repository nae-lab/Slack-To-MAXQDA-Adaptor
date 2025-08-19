import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { SlackMaxqdaAdapter } from 'slack-maxqda-adapter'
import { WebClient } from '@slack/web-api'
import { secureStorage } from "./storage.ts";
import type { SlackTokenInfo } from "./storage.ts";
import { createHash } from "crypto";

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
    icon: join(__dirname, '../public/app-iconpng.png')
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

app.whenReady().then(() => {
  // Suppress CoreText font warnings on macOS
  if (process.platform === 'darwin') {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
    app.commandLine.appendSwitch('disable-font-subpixel-positioning')
    app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
  }
  createWindow()
})

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

ipcMain.handle("export-slack", async (event, options) => {
  try {
    const adapter = new SlackMaxqdaAdapter({
      token: options.token,
      concurrency: options.concurrency || 4,
      onProgress: (progress) => {
        // Send progress update to renderer
        event.sender.send("export-progress", progress);
      },
      onLog: (logEntry) => {
        // Send log entry to renderer
        event.sender.send("export-log", logEntry);
      },
    });

    const result = await adapter.export({
      channelId: options.channelId,
      startDate: options.startDate,
      endDate: options.endDate || options.startDate,
      format: options.format,
      outputPath: options.outputPath,
    });

    return { success: true, result };
  } catch (error: unknown) {
    console.error("Export error:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle(
  "export-multiple",
  async (
    _: any,
    {
      token,
      exports,
      concurrency,
    }: {
      token: string;
      exports: Array<{
        channelId: string;
        startDate: string;
        endDate?: string;
        format: "docx" | "md";
        outputPath: string;
      }>;
      concurrency?: number;
    }
  ) => {
    try {
      const adapter = new SlackMaxqdaAdapter({
        token,
        concurrency: concurrency || 4,
      });

      const exportOptions = exports.map((exportConfig) => ({
        channelId: exportConfig.channelId,
        startDate: exportConfig.startDate,
        endDate: exportConfig.endDate || exportConfig.startDate,
        format: exportConfig.format,
        outputPath: exportConfig.outputPath,
      }));

      const results = await adapter.exportMultiple(exportOptions);

      return { success: true, results };
    } catch (error: unknown) {
      console.error("Export error:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle("get-channel-name", async (_, { token, channelId }) => {
  try {
    const client = new WebClient(token);
    
    // Get current user info to exclude from DM names
    const authResult = await client.auth.test();
    const currentUserId = authResult.user_id;
    
    const result = await client.conversations.info({
      channel: channelId,
    });

    if (result.ok && result.channel) {
      // Check if it's a DM/MPDM first, before checking for regular channel name
      const isIM = !!result.channel.is_im;
      const isMPIM = !!result.channel.is_mpim;
      
      // For DMs/MPDMs: Always process as DM regardless of name
      const isDM = isIM || isMPIM || (result.channel.name && result.channel.name.startsWith('mpdm-'));
      
      if (!isDM && result.channel.name) {
        // For regular channels (not DM/MPDM), use the name
        return { success: true, channelName: result.channel.name };
      }
      
      if (isDM) {
        try {
          const membersResult = await client.conversations.members({
            channel: channelId,
          });
          
          if (membersResult.ok && membersResult.members) {
            // Get user info for members (excluding bots and current user)
            const otherMembers = membersResult.members
              .filter(member => !member.startsWith('B') && member !== currentUserId);
            
            if (otherMembers.length === 0) {
              // DM with only current user (shouldn't happen, but handle gracefully)
              return { success: true, channelName: "Self DM" };
            }
            
            const userPromises = otherMembers.map(userId => client.users.info({ user: userId }));
            const userResults = await Promise.all(userPromises);
            
            const userNames = userResults
              .filter(userResult => userResult.ok && userResult.user)
              .map(userResult => {
                const user = userResult.user!;
                const displayName = user.profile?.display_name || user.real_name || user.name || 'User';
                return displayName;
              })
              .filter(name => name);
            
            if (userNames.length > 0) {
              if (userNames.length === 1) {
                // 1-on-1 DM
                return { success: true, channelName: userNames[0] };
              } else {
                // Group DM (MPDM)
                const groupName = `${userNames.join(', ')} (Group)`;
                return { success: true, channelName: groupName };
              }
            }
          }
        } catch (memberError) {
          console.error("Get DM members error:", memberError);
        }
        
        // Fallback for DMs
        const memberCount = result.channel.members?.length || 0;
        if (memberCount > 2) {
          return { success: true, channelName: "Group DM" };
        } else {
          return { success: true, channelName: "Direct Message" };
        }
      }
      
      // For other channel types without name
      return { success: true, channelName: `Channel ${channelId}` };
    }

    return { success: false, error: "Channel not found" };
  } catch (error: unknown) {
    console.error("Get channel name error:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("choose-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory", "createDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("save-file-dialog", async (_, defaultFileName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultFileName,
    filters: [
      { name: "Word Documents", extensions: ["docx"] },
      { name: "Markdown Files", extensions: ["md"] },
    ],
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

// Secure token storage handlers
ipcMain.handle("store-slack-token", async (_, token: string) => {
  try {
    secureStorage.setSlackToken(token);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error storing token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("get-slack-token", async () => {
  try {
    const token = secureStorage.getSlackToken();
    return { success: true, token };
  } catch (error: unknown) {
    console.error("Error retrieving token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("clear-slack-token", async () => {
  try {
    secureStorage.clearSlackToken();
    return { success: true };
  } catch (error: unknown) {
    console.error("Error clearing token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("has-slack-token", async () => {
  try {
    const hasToken = secureStorage.hasSlackToken();
    return { success: true, hasToken };
  } catch (error: unknown) {
    console.error("Error checking token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("validate-slack-token", async (_, token: string) => {
  try {
    const client = new WebClient(token);
    const result = await client.auth.test();

    if (result.ok) {
      return {
        success: true,
        user: result.user,
        team: result.team,
        teamId: result.team_id,
        userId: result.user_id,
      };
    } else {
      return { success: false, error: "Invalid token" };
    }
  } catch (error: unknown) {
    console.error("Token validation error:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Multi-token management handlers
ipcMain.handle("add-slack-token", async (_, token: string) => {
  try {
    // First validate the token to get user/team info
    const client = new WebClient(token);
    const result = await client.auth.test();

    if (!result.ok) {
      return { success: false, error: "Invalid token" };
    }

    // Create a unique ID for this token based on team and user
    const tokenId = createHash("sha256")
      .update(`${result.team_id}-${result.user_id}`)
      .digest("hex")
      .substring(0, 16);

    const tokenInfo: SlackTokenInfo = {
      id: tokenId,
      token,
      teamName: result.team || "Unknown Team",
      userName: result.user || "Unknown User",
      teamId: result.team_id || "",
      userId: result.user_id || "",
      createdAt: new Date(),
    };

    secureStorage.addSlackToken(tokenInfo);

    // If this is the first token, select it automatically
    const tokens = secureStorage.getSlackTokens();
    if (tokens.length === 1) {
      secureStorage.setSelectedTokenId(tokenId);
    }

    return { success: true, tokenInfo };
  } catch (error: unknown) {
    console.error("Error adding token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("get-slack-tokens", async () => {
  try {
    const tokens = secureStorage.getSlackTokens();
    const selectedTokenId = secureStorage.getSelectedTokenId();
    return { success: true, tokens, selectedTokenId };
  } catch (error: unknown) {
    console.error("Error retrieving tokens:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("select-slack-token", async (_, tokenId: string) => {
  try {
    secureStorage.setSelectedTokenId(tokenId);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error selecting token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("remove-slack-token", async (_, tokenId: string) => {
  try {
    secureStorage.removeSlackToken(tokenId);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error removing token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("get-selected-token", async () => {
  try {
    const selectedToken = secureStorage.getSelectedToken();
    return { success: true, token: selectedToken?.token || null };
  } catch (error: unknown) {
    console.error("Error getting selected token:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("get-channels", async (_, token: string) => {
  try {
    const client = new WebClient(token);
    const channels: Array<{
      id?: string;
      name?: string;
      isPrivate?: boolean;
      memberCount?: number;
      purpose: string;
      topic: string;
    }> = [];
    let cursor: string | undefined = undefined;

    // Fetch all public channels
    do {
      const result = await client.conversations.list({
        types: "public_channel,private_channel",
        exclude_archived: true,
        limit: 200,
        cursor,
      });

      if (result.ok && result.channels) {
        channels.push(
          ...result.channels.map((channel: any) => ({
            id: channel.id as string | undefined,
            name: channel.name as string | undefined,
            isPrivate: channel.is_private as boolean | undefined,
            memberCount: channel.num_members as number | undefined,
            purpose: (channel.purpose?.value as string | undefined) || "",
            topic: (channel.topic?.value as string | undefined) || "",
          }))
        );
        cursor = result.response_metadata?.next_cursor as string | undefined;
      } else {
        break;
      }
    } while (cursor);

    return { success: true, channels };
  } catch (error: unknown) {
    console.error("Get channels error:", error);
    return { success: false, error: (error as Error).message };
  }
});