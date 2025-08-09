export interface ProgressUpdate {
  stage: 'fetching' | 'processing' | 'downloading' | 'writing' | 'complete'
  progress: number
  message: string
  current?: number
  total?: number
  details?: {
    currentFile?: string
    filesCompleted?: number
    totalFiles?: number
  }
}

export interface LogEntry {
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  purpose: string
  topic: string
}

export interface SlackTokenInfo {
  id: string;
  token: string;
  teamName: string;
  userName: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}

export interface IElectronAPI {
  exportSlack: (options: {
    token: string;
    channelId: string;
    startDate: string;
    endDate?: string;
    format: "docx" | "md";
    outputPath: string;
    concurrency?: number;
  }) => Promise<{
    success: boolean;
    result?: {
      filePath: string;
      channelName: string;
      messageCount: number;
      format: string;
    };
    error?: string;
  }>;
  exportMultiple: (data: {
    token: string;
    exports: Array<{
      channelId: string;
      startDate: string;
      endDate?: string;
      format: "docx" | "md";
      outputPath: string;
    }>;
    concurrency?: number;
  }) => Promise<{
    success: boolean;
    results?: Array<{
      filePath: string;
      channelName: string;
      messageCount: number;
      format: string;
    }>;
    error?: string;
  }>;
  getChannelName: (data: { token: string; channelId: string }) => Promise<{
    success: boolean;
    channelName?: string;
    error?: string;
  }>;
  chooseDirectory: () => Promise<string | null>;
  saveFileDialog: (defaultFileName: string) => Promise<string | null>;

  // Legacy token storage (for backward compatibility)
  storeSlackToken: (
    token: string
  ) => Promise<{ success: boolean; error?: string }>;
  getSlackToken: () => Promise<{
    success: boolean;
    token?: string | null;
    error?: string;
  }>;
  clearSlackToken: () => Promise<{ success: boolean; error?: string }>;
  hasSlackToken: () => Promise<{
    success: boolean;
    hasToken?: boolean;
    error?: string;
  }>;

  // New multi-token management
  addSlackToken: (token: string) => Promise<{
    success: boolean;
    tokenInfo?: SlackTokenInfo;
    error?: string;
  }>;
  getSlackTokens: () => Promise<{
    success: boolean;
    tokens?: SlackTokenInfo[];
    selectedTokenId?: string | null;
    error?: string;
  }>;
  selectSlackToken: (
    tokenId: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeSlackToken: (
    tokenId: string
  ) => Promise<{ success: boolean; error?: string }>;
  getSelectedToken: () => Promise<{
    success: boolean;
    token?: string | null;
    error?: string;
  }>;

  validateSlackToken: (token: string) => Promise<{
    success: boolean;
    user?: string;
    team?: string;
    teamId?: string;
    userId?: string;
    error?: string;
  }>;
  getChannels: (token: string) => Promise<{
    success: boolean;
    channels?: SlackChannel[];
    error?: string;
  }>;

  onProgress: (callback: (progress: ProgressUpdate) => void) => () => void;
  onLog: (callback: (logEntry: LogEntry) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}