export interface IElectronAPI {
  exportSlack: (options: {
    token: string
    channelId: string
    startDate: string
    endDate?: string
    format: 'docx' | 'md'
    outputPath: string
    concurrency?: number
  }) => Promise<{
    success: boolean
    result?: {
      filePath: string
      channelName: string
      messageCount: number
      format: string
    }
    error?: string
  }>
  exportMultiple: (data: {
    token: string
    exports: Array<{
      channelId: string
      startDate: string
      endDate?: string
      format: 'docx' | 'md'
      outputPath: string
    }>
    concurrency?: number
  }) => Promise<{
    success: boolean
    results?: Array<{
      filePath: string
      channelName: string
      messageCount: number
      format: string
    }>
    error?: string
  }>
  getChannelName: (data: {
    token: string
    channelId: string
  }) => Promise<{
    success: boolean
    channelName?: string
    error?: string
  }>
  chooseDirectory: () => Promise<string | null>
  saveFileDialog: (defaultFileName: string) => Promise<string | null>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}