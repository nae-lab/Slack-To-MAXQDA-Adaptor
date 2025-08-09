import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
} from "@/components/ui/select";
import { ChannelSelector } from './ChannelSelector'
import { SlackTokenSelector } from "./SlackTokenSelector";
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProgressUpdate, LogEntry } from '@/types/electron'

export function ExportForm() {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [isTokenValid, setIsTokenValid] = useState(false);
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

  useEffect(() => {
    const unsubscribeProgress = window.electronAPI.onProgress((progressUpdate: ProgressUpdate) => {
      setProgress(progressUpdate)
    })

    const unsubscribeLog = window.electronAPI.onLog((logEntry: LogEntry) => {
      setLogs(prev => [...prev, { ...logEntry, timestamp: new Date(logEntry.timestamp) }])
    })

    return () => {
      unsubscribeProgress()
      unsubscribeLog()
    }
  }, [])

  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    // Clear channel selection when token changes
    setChannelId('');
  };

  const handleTokenValidated = (isValid: boolean) => {
    setIsTokenValid(isValid);
  };

  const handleChooseFile = async () => {
    const defaultName = `slack-export-${channelId}-${startDate}.${format}`
    const path = await window.electronAPI.saveFileDialog(defaultName)
    if (path) {
      setOutputPath(path)
    }
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
      <SlackTokenSelector
        onValueChange={handleTokenChange}
        onTokenValidated={handleTokenValidated}
      />

      <div className="space-y-2">
        <Label htmlFor="channelId">{t("export.channelId")}</Label>
        <ChannelSelector
          token={token}
          value={channelId}
          onValueChange={setChannelId}
          placeholder={t("export.channelIdPlaceholder")}
          disabled={!isTokenValid}
        />
        <p className="text-sm text-muted-foreground">
          {t("export.channelIdHelp")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t("export.startDate")}</Label>
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
          <Label htmlFor="endDate">{t("export.endDate")}</Label>
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
        <Label htmlFor="format">{t("export.format")}</Label>
        <Select
          value={format}
          onValueChange={(value: "docx" | "md") => setFormat(value)}
        >
          <SelectTrigger id="format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="docx">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {t("export.formatDocx")}
              </div>
            </SelectItem>
            <SelectItem value="md">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {t("export.formatMd")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputPath">{t("export.outputPath")}</Label>
        <div className="flex gap-2">
          <Input
            id="outputPath"
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            readOnly
          />
          <Button onClick={handleChooseFile} variant="outline">
            {t("export.chooseFile")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="concurrency">{t("export.concurrency")}</Label>
        <Input
          id="concurrency"
          type="number"
          min="1"
          max="10"
          value={concurrency}
          onChange={(e) => setConcurrency(parseInt(e.target.value) || 4)}
        />
        <p className="text-sm text-muted-foreground">
          {t("export.concurrencyHelp")}
        </p>
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

          {progress.stage === "downloading" && progress.details && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Files: {progress.details.filesCompleted || 0} /{" "}
                {progress.details.totalFiles || 0}
              </div>
              {progress.details.currentFile && (
                <div className="text-xs text-muted-foreground truncate">
                  Current: {progress.details.currentFile}
                </div>
              )}
            </div>
          )}

          {progress.current !== undefined &&
            progress.total !== undefined &&
            progress.stage !== "downloading" && (
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
                {showLogs ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
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
                          log.level === "error"
                            ? "text-red-500"
                            : log.level === "warning"
                            ? "text-yellow-500"
                            : log.level === "success"
                            ? "text-green-500"
                            : "text-muted-foreground"
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
            {t("results.success")}
            <br />
            {t("results.exported", {
              count: success.messageCount,
              path: success.filePath,
            })}
            <br />
            {t("results.channel", { name: success.channelName })}
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
            {t("export.exporting")}
          </>
        ) : (
          t("export.exportButton")
        )}
      </Button>
    </div>
  );
}