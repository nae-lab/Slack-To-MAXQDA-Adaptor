import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, FileText, Loader2, ChevronDown, ChevronUp, Eye, EyeOff, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlackManifestDialog } from './SlackManifestDialog'
import { ChannelSelector } from './ChannelSelector'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProgressUpdate, LogEntry } from '@/types/electron'

export function ExportForm() {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [hasStoredToken, setHasStoredToken] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [tokenValidation, setTokenValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid'
    user?: string
    team?: string
    error?: string
  }>({ status: 'idle' })
  const [channelId, setChannelId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [format, setFormat] = useState<'docx' | 'md'>('docx')
  const [outputPath, setOutputPath] = useState('')
  const [concurrency, setConcurrency] = useState(4)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)
  const [progress, setProgress] = useState<ProgressUpdate | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [channelName, setChannelName] = useState('')

  useEffect(() => {
    const unsubscribeProgress = window.electronAPI.onProgress((progressUpdate: ProgressUpdate) => {
      setProgress(progressUpdate)
    })

    const unsubscribeLog = window.electronAPI.onLog((logEntry: LogEntry) => {
      setLogs(prev => [...prev, { ...logEntry, timestamp: new Date(logEntry.timestamp) }])
    })

    // Load stored token on component mount
    loadStoredToken()

    return () => {
      unsubscribeProgress()
      unsubscribeLog()
    }
  }, [])

  const loadStoredToken = async () => {
    try {
      const result = await window.electronAPI.getSlackToken()
      if (result.success && result.token) {
        setToken(result.token)
        setHasStoredToken(true)
        // Validate the stored token
        await validateToken(result.token)
      } else {
        setHasStoredToken(false)
      }
    } catch (error) {
      console.error('Error loading stored token:', error)
      setHasStoredToken(false)
    }
  }

  const validateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate) {
      setTokenValidation({ status: 'idle' })
      return
    }

    setTokenValidation({ status: 'validating' })
    
    try {
      const result = await window.electronAPI.validateSlackToken(tokenToValidate)
      if (result.success) {
        setTokenValidation({
          status: 'valid',
          user: result.user,
          team: result.team
        })
      } else {
        setTokenValidation({
          status: 'invalid',
          error: result.error
        })
      }
    } catch (error) {
      setTokenValidation({
        status: 'invalid',
        error: 'Validation failed'
      })
    }
  }

  const handleTokenChange = async (newToken: string) => {
    setToken(newToken)
    
    // Clear previous validation
    setTokenValidation({ status: 'idle' })
    
    if (newToken) {
      try {
        await window.electronAPI.storeSlackToken(newToken)
        setHasStoredToken(true)
        
        // Debounced validation
        setTimeout(() => validateToken(newToken), 1000)
      } catch (error) {
        console.error('Error storing token:', error)
      }
    } else {
      setHasStoredToken(false)
    }
  }

  const handleClearToken = async () => {
    try {
      await window.electronAPI.clearSlackToken()
      setToken('')
      setHasStoredToken(false)
      setTokenValidation({ status: 'idle' })
    } catch (error) {
      console.error('Error clearing token:', error)
    }
  }

  const handleChooseFile = async () => {
    const defaultName = `slack-export-${channelId}-${startDate}.${format}`
    const path = await window.electronAPI.saveFileDialog(defaultName)
    if (path) {
      setOutputPath(path)
    }
  }

  // Fetch channel name when channelId changes
  const fetchChannelName = async (newChannelId: string) => {
    if (!newChannelId || !token) {
      setChannelName('')
      return
    }
    
    try {
      const result = await window.electronAPI.getChannelName({ token, channelId: newChannelId })
      if (result.success && result.channelName) {
        setChannelName(result.channelName)
      } else {
        setChannelName(newChannelId) // Fallback to ID if name fetch fails
      }
    } catch (error) {
      setChannelName(newChannelId) // Fallback to ID if error
    }
  }

  const handleChannelChange = (newChannelId: string) => {
    setChannelId(newChannelId)
    fetchChannelName(newChannelId)
  }

  // Generate display path showing the new folder structure
  const getDisplayPath = () => {
    if (!outputPath) return ''
    
    // Use fetched channel name or fallback to channelId
    const displayChannelName = channelName || channelId || 'channel'
    
    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]
    const folderName = `${displayChannelName}_at_${currentDate}`
    
    // Get the directory from outputPath and combine with new structure
    const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'))
    return `${outputDir}/${folderName}/`
  }


  const handleExport = async () => {
    setError('')
    setSuccess(null)
    setProgress(null)
    setLogs([])
    setShowLogs(false)

    if (!token) {
      setError(t('errors.tokenRequired'))
      return
    }
    if (!channelId) {
      setError(t('errors.channelRequired'))
      return
    }
    if (!startDate) {
      setError(t('errors.dateRequired'))
      return
    }
    if (!outputPath) {
      setError(t('errors.pathRequired'))
      return
    }

    setIsExporting(true)
    try {
      const result = await window.electronAPI.exportSlack({
        token,
        channelId,
        startDate,
        endDate: endDate || startDate,
        format,
        outputPath,
        concurrency
      })

      if (result.success) {
        setSuccess(result.result)
      } else {
        setError(t('errors.exportFailed', { error: result.error }))
      }
    } catch (err) {
      setError(t('errors.exportFailed', { error: (err as Error).message }))
    } finally {
      setIsExporting(false)
      // Clear progress after a short delay to show completion
      setTimeout(() => setProgress(null), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="token">{t('export.token')}</Label>
          <div className="flex items-center gap-2">
            {tokenValidation.status === 'validating' && (
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">{t('validation.validating')}</span>
              </div>
            )}
            {tokenValidation.status === 'valid' && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">{t('validation.valid')}</span>
              </div>
            )}
            {tokenValidation.status === 'invalid' && (
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">{t('validation.invalid')}</span>
              </div>
            )}
            {hasStoredToken && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600">{t('validation.storedSecurely')}</span>
                <Button
                  onClick={handleClearToken}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <Input
            id="token"
            type={showToken ? "text" : "password"}
            placeholder={t('export.tokenPlaceholder')}
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowToken(!showToken)}
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex justify-between items-start">
          <SlackManifestDialog />
          <div className="flex flex-col items-end gap-1">
            {tokenValidation.status === 'valid' && tokenValidation.user && tokenValidation.team && (
              <div className="text-xs text-green-600">
                {t('validation.connectedAs', { user: tokenValidation.user, team: tokenValidation.team })}
              </div>
            )}
            {tokenValidation.status === 'invalid' && tokenValidation.error && (
              <div className="text-xs text-red-600">
                {tokenValidation.error}
              </div>
            )}
            {token && (
              <span className="text-xs text-muted-foreground">
                {t('validation.tokenStoredInfo')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channelId">{t('export.channelId')}</Label>
        <ChannelSelector
          token={token}
          value={channelId}
          onValueChange={handleChannelChange}
          placeholder={t('export.channelIdPlaceholder')}
          disabled={tokenValidation.status !== 'valid'}
        />
        <p className="text-sm text-muted-foreground">{t('export.channelIdHelp')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('export.startDate')}</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="startDate"
              type="date"
              className="pl-10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">{t('export.endDate')}</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endDate"
              type="date"
              className="pl-10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">{t('export.format')}</Label>
        <Select value={format} onValueChange={(value: 'docx' | 'md') => setFormat(value)}>
          <SelectTrigger id="format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="docx">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {t('export.formatDocx')}
              </div>
            </SelectItem>
            <SelectItem value="md">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {t('export.formatMd')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputPath">{t('export.outputPath')}</Label>
        <div className="flex gap-2">
          <Input
            id="outputPath"
            value={getDisplayPath()}
            onChange={(e) => setOutputPath(e.target.value)}
            readOnly
            placeholder={t('export.outputPathPlaceholder')}
          />
          <Button onClick={handleChooseFile} variant="outline">
            {t('export.chooseFile')}
          </Button>
        </div>
        {outputPath && channelName && (
          <p className="text-sm text-muted-foreground">
            {t('export.folderStructureNote', { 
              channelName, 
              date: new Date().toISOString().split('T')[0] 
            })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="concurrency">{t('export.concurrency')}</Label>
        <Input
          id="concurrency"
          type="number"
          min="1"
          max="10"
          value={concurrency}
          onChange={(e) => setConcurrency(parseInt(e.target.value) || 4)}
        />
        <p className="text-sm text-muted-foreground">{t('export.concurrencyHelp')}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {progress && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">{progress.message}</span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="w-full" />
          
          {progress.stage === 'downloading' && progress.details && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Files: {progress.details.filesCompleted || 0} / {progress.details.totalFiles || 0}
              </div>
              {progress.details.currentFile && (
                <div className="text-xs text-muted-foreground truncate">
                  Current: {progress.details.currentFile}
                </div>
              )}
            </div>
          )}
          
          {progress.current !== undefined && progress.total !== undefined && progress.stage !== 'downloading' && (
            <div className="text-xs text-muted-foreground">
              {progress.current} / {progress.total}
            </div>
          )}
          
          {logs.length > 0 && (
            <div className="border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full justify-between p-3 text-xs"
              >
                <span>Detailed Logs ({logs.length})</span>
                {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              
              {showLogs && (
                <div className="border-t max-h-40 overflow-y-auto p-3 space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono">
                      <span className="text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span 
                        className={`ml-2 ${
                          log.level === 'error' ? 'text-red-500' :
                          log.level === 'warning' ? 'text-yellow-500' :
                          log.level === 'success' ? 'text-green-500' :
                          'text-muted-foreground'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {success && (
        <Alert>
          <AlertDescription>
            {t('results.success')}
            <br />
            {t('results.exported', { count: success.messageCount, path: success.filePath })}
            <br />
            {t('results.channel', { name: success.channelName })}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full"
        size="lg"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('export.exporting')}
          </>
        ) : (
          t('export.exportButton')
        )}
      </Button>
    </div>
  )
}