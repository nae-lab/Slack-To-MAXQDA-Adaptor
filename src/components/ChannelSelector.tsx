import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Hash, Lock, Search, Loader2, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SlackChannel } from '@/types/electron'

interface ChannelSelectorProps {
  token: string
  value: string
  onValueChange: (channelId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ChannelSelector({ 
  token, 
  value, 
  onValueChange, 
  placeholder,
  disabled = false 
}: ChannelSelectorProps) {
  const { t } = useTranslation()
  
  // Simplified state management - only 5 state variables
  const [inputValue, setInputValue] = useState('')
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showChannelList, setShowChannelList] = useState(false)
  
  // Channel validation state
  const [validating, setValidating] = useState(false)
  const [validatedChannel, setValidatedChannel] = useState<SlackChannel | null>(null)

  const isChannelId = useCallback((input: string): boolean => {
    const trimmed = input.trim()
    // Channel IDs: C/D/G + 10 characters (total 11 chars)
    return /^[CDG][A-Z0-9]{10}$/i.test(trimmed)
  }, [])

  const validateChannelId = useCallback(async (channelId: string) => {
    if (!token || !channelId || !isChannelId(channelId)) return

    setValidating(true)
    setError('')
    
    try {
      const result = await window.electronAPI.getChannelName({ token, channelId })
      if (result.success && result.channelName) {
        const channel: SlackChannel = {
          id: channelId,
          name: result.channelName,
          isPrivate: channelId.startsWith('D') || channelId.startsWith('G') || 
                     result.channelName.includes('(Group)') || result.channelName === 'Direct Message',
          purpose: '',
          topic: '',
          memberCount: 0
        }
        setValidatedChannel(channel)
      } else {
        setError(result.error || 'Failed to validate channel')
        setValidatedChannel(null)
      }
    } catch (err) {
      setError('Failed to validate channel')
      setValidatedChannel(null)
    } finally {
      setValidating(false)
    }
  }, [token, isChannelId])

  const fetchChannels = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError('')
    
    try {
      const result = await window.electronAPI.getChannels(token)
      if (result.success && result.channels) {
        setChannels(result.channels.sort((a, b) => a.name.localeCompare(b.name)))
      } else {
        setError(result.error || t('channels.fetchError'))
      }
    } catch (err) {
      setError(t('channels.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [token, t])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    setValidatedChannel(null)
    setError('')
  }

  const handleValidate = () => {
    if (inputValue && isChannelId(inputValue)) {
      const channelId = inputValue.trim()
      onValueChange(channelId)
      validateChannelId(channelId)
    }
  }

  const handleSelect = (channel: SlackChannel) => {
    onValueChange(channel.id)
    setInputValue(channel.id)
    setValidatedChannel(channel)
    setShowChannelList(false)
  }

  const handleBrowseChannels = () => {
    setShowChannelList(true)
    fetchChannels()
  }

  const handleBackToInput = () => {
    setShowChannelList(false)
    setChannels([])
    setError('')
  }

  const filteredChannels = channels.filter(channel =>
    inputValue === '' || 
    channel.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    channel.purpose.toLowerCase().includes(inputValue.toLowerCase()) ||
    channel.topic.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Display selected channel info
  const displayChannel = validatedChannel || (value ? { 
    id: value, 
    name: value, 
    isPrivate: value.startsWith('D') || value.startsWith('G'),
    purpose: '',
    topic: '',
    memberCount: 0
  } : null)

  return (
    <div className="space-y-2">
      {!showChannelList ? (
        // Channel ID input mode
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder || t('channels.inputPlaceholder')}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={disabled || !token}
              className="flex-1"
            />
            <Button
              onClick={handleValidate}
              disabled={!inputValue || !isChannelId(inputValue) || validating || !token}
              size="sm"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('channels.validating')}
                </>
              ) : (
                t('channels.validate')
              )}
            </Button>
          </div>
          
          {validatedChannel && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
              {validatedChannel.isPrivate ? (
                <Lock className="h-4 w-4 text-green-600" />
              ) : (
                <Hash className="h-4 w-4 text-green-600" />
              )}
              <span className="text-green-800">{validatedChannel.name}</span>
              <span className="text-green-600">({validatedChannel.id})</span>
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleBrowseChannels}
            disabled={disabled || !token}
            className="w-full"
          >
            <List className="h-4 w-4 mr-2" />
            {t('channels.browseButton')}
          </Button>
        </div>
      ) : (
        // Channel list mode
        <Popover open={true} onOpenChange={() => {}}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between text-left font-normal"
              disabled={disabled || !token}
            >
              {displayChannel ? (
                <span className="flex items-center gap-2">
                  {displayChannel.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  {displayChannel.name}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder || t('channels.selectPlaceholder')}</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="flex flex-col">
              <div className="flex items-center border-b px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToInput}
                  className="mr-2"
                >
                  ←
                </Button>
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={t('channels.searchPlaceholder')}
                  className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">{t('channels.loading')}</span>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchChannels}
                      className="mt-2"
                    >
                      {t('channels.retry')}
                    </Button>
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {!token ? t('channels.selectTokenFirst') : t('channels.noChannels')}
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredChannels.map((channel) => (
                      <div
                        key={channel.id}
                        onClick={() => handleSelect(channel)}
                        className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      >
                        {channel.isPrivate ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Hash className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{channel.name}</div>
                          {(channel.purpose || channel.topic) && (
                            <div className="text-xs text-muted-foreground truncate">
                              {channel.purpose || channel.topic}
                            </div>
                          )}
                        </div>
                        {channel.memberCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {t('channels.members', { count: channel.memberCount })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}