import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Hash, Lock, Search, Loader2 } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [channelIdResult, setChannelIdResult] = useState<{ id: string; name: string } | null>(null)
  const [channelIdLoading, setChannelIdLoading] = useState(false)
  const [channelIdError, setChannelIdError] = useState('')
  const backgroundFetchRef = useRef<Promise<void> | null>(null)
  const channelIdFetchRef = useRef<Promise<void> | null>(null)

  const isChannelId = useCallback((input: string): boolean => {
    return /^[CDG][A-Z0-9]{9,10}$/i.test(input.trim())
  }, [])

  const selectedChannel = useMemo(() => {
    const foundChannel = channels.find(channel => channel.id === value)
    if (foundChannel) return foundChannel
    
    // If no channel found in list but value matches channelIdResult, use that
    if (channelIdResult && channelIdResult.id === value) {
      return {
        id: channelIdResult.id,
        name: channelIdResult.name,
        isPrivate: false, // Default assumption for unknown channels
        purpose: '',
        topic: '',
        memberCount: 0
      } as SlackChannel
    }
    
    return undefined
  }, [channels, value, channelIdResult])

  const filteredChannels = useMemo(() => {
    if (!search) return channels
    
    // If search looks like a channel ID, check if we have a result for it
    if (isChannelId(search)) {
      if (channelIdResult && channelIdResult.id.toLowerCase() === search.toLowerCase()) {
        // Create a temporary channel object for display
        const tempChannel: SlackChannel = {
          id: channelIdResult.id,
          name: channelIdResult.name,
          isPrivate: false,
          purpose: '',
          topic: '',
          memberCount: 0
        }
        return [tempChannel]
      }
      // If it's a channel ID but we don't have results yet, return empty
      return []
    }
    
    // Regular text search
    const searchLower = search.toLowerCase()
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(searchLower) ||
      channel.purpose.toLowerCase().includes(searchLower) ||
      channel.topic.toLowerCase().includes(searchLower)
    )
  }, [channels, search, isChannelId, channelIdResult])

  const fetchChannels = async (showLoading = true) => {
    if (!token) return
    
    // If already loading in background, wait for it
    if (backgroundFetchRef.current) {
      await backgroundFetchRef.current
      return
    }
    
    if (showLoading) {
      setLoading(true)
    } else {
      setBackgroundLoading(true)
    }
    setError('')
    
    const fetchPromise = (async () => {
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
        if (showLoading) {
          setLoading(false)
        } else {
          setBackgroundLoading(false)
        }
        backgroundFetchRef.current = null
      }
    })()
    
    backgroundFetchRef.current = fetchPromise
    return fetchPromise
  }

  const fetchChannelName = async (channelId: string) => {
    if (!token || !channelId) return
    
    // If already fetching this channel ID, wait for it
    if (channelIdFetchRef.current) {
      await channelIdFetchRef.current
      return
    }
    
    setChannelIdLoading(true)
    setChannelIdError('')
    
    const fetchPromise = (async () => {
      try {
        const result = await window.electronAPI.getChannelName({ token, channelId })
        if (result.success && result.channelName) {
          setChannelIdResult({ id: channelId, name: result.channelName })
        } else {
          setChannelIdError(result.error || 'Failed to fetch channel name')
          setChannelIdResult(null)
        }
      } catch (err) {
        setChannelIdError('Failed to fetch channel name')
        setChannelIdResult(null)
      } finally {
        setChannelIdLoading(false)
        channelIdFetchRef.current = null
      }
    })()
    
    channelIdFetchRef.current = fetchPromise
    return fetchPromise
  }

  useEffect(() => {
    if (token && open) {
      fetchChannels()
    }
  }, [token, open])

  // Handle channel ID search with debounce
  useEffect(() => {
    if (!search || !token) {
      setChannelIdResult(null)
      setChannelIdError('')
      setChannelIdLoading(false)
      return
    }
    
    if (isChannelId(search)) {
      const trimmedSearch = search.trim()
      
      // Clear previous result if searching for different ID
      if (channelIdResult && channelIdResult.id.toLowerCase() !== trimmedSearch.toLowerCase()) {
        setChannelIdResult(null)
        setChannelIdError('')
      }
      
      // Skip if we already have the result for this ID
      if (channelIdResult && channelIdResult.id.toLowerCase() === trimmedSearch.toLowerCase()) {
        return
      }
      
      // Debounce channel name fetch
      const timeoutId = setTimeout(() => {
        fetchChannelName(trimmedSearch)
      }, 300)
      
      return () => clearTimeout(timeoutId)
    } else {
      // Clear channel ID results when not searching for ID
      setChannelIdResult(null)
      setChannelIdError('')
      setChannelIdLoading(false)
    }
  }, [search, token, isChannelId, channelIdResult])

  // Clear channels and selected value when token changes, then start background fetch
  useEffect(() => {
    setChannels([])
    setError('')
    setBackgroundLoading(false)
    setChannelIdResult(null)
    setChannelIdError('')
    onValueChange('')
    
    // Start background fetch if token exists
    if (token) {
      fetchChannels(false) // Don't show loading indicator for background fetch
    }
  }, [token])

  const handleSelect = (channelId: string) => {
    onValueChange(channelId)
    setOpen(false)
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
          disabled={disabled || !token}
        >
          {selectedChannel ? (
            <span className="flex items-center gap-2">
              {selectedChannel.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              {selectedChannel.name}
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
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={t('channels.searchPlaceholder') + ' or Channel ID (C1234567890)'}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {(loading || backgroundLoading) ? (
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
                  onClick={() => fetchChannels(true)}
                  className="mt-2"
                >
                  {t('channels.retry')}
                </Button>
              </div>
            ) : isChannelId(search) && channelIdLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Fetching channel name...</span>
              </div>
            ) : isChannelId(search) && channelIdError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-600">{channelIdError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchChannelName(search.trim())}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {!token ? t('channels.selectTokenFirst') : 
                 isChannelId(search) ? 'Enter a valid channel ID' :
                 t('channels.noChannels')}
              </div>
            ) : (
              <div className="p-1">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => handleSelect(channel.id)}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {channel.isPrivate ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{channel.name}</div>
                      {isChannelId(search) ? (
                        <div className="text-xs text-muted-foreground">
                          ID: {channel.id}
                        </div>
                      ) : (channel.purpose || channel.topic) && (
                        <div className="text-xs text-muted-foreground truncate">
                          {channel.purpose || channel.topic}
                        </div>
                      )}
                    </div>
                    {!isChannelId(search) && channel.memberCount > 0 && (
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
  )
}