import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlackManifestDialog } from './SlackManifestDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ExportForm() {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [channelId, setChannelId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format, setFormat] = useState<'docx' | 'md'>('docx')
  const [outputPath, setOutputPath] = useState('')
  const [concurrency, setConcurrency] = useState(4)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)

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
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="token">{t('export.token')}</Label>
        <Input
          id="token"
          type="password"
          placeholder={t('export.tokenPlaceholder')}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <SlackManifestDialog />
      </div>

      <div className="space-y-2">
        <Label htmlFor="channelId">{t('export.channelId')}</Label>
        <Input
          id="channelId"
          placeholder={t('export.channelIdPlaceholder')}
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
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
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            readOnly
          />
          <Button onClick={handleChooseFile} variant="outline">
            {t('export.chooseFile')}
          </Button>
        </div>
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