import { useState } from 'react'
import { usePlatformAccounts, usePublish, getPlatformConfig } from '../hooks/usePlatforms'

interface QuickPublishDrawerProps {
  isOpen: boolean
  onClose: () => void
  episodeId?: string
  episodeTitle?: string
  thumbnailUrl?: string
  duration?: string
}

export function QuickPublishDrawer({
  isOpen,
  onClose,
  episodeId,
  episodeTitle = 'Untitled Episode',
  thumbnailUrl,
  duration = '00:00',
}: QuickPublishDrawerProps) {
  const { data: accounts, isLoading } = usePlatformAccounts()
  const publishMutation = usePublish()

  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState(episodeTitle)
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState<string[]>(['cyberpunk', 'anime', 'aiart'])
  const [newHashtag, setNewHashtag] = useState('')
  const [allowDuet, setAllowDuet] = useState(true)
  const [saveToDevice, setSaveToDevice] = useState(false)

  const connectedAccounts = accounts?.filter(a => a.status === 'connected') || []

  const toggleAccount = (accountId: string) => {
    const newSet = new Set(selectedAccountIds)
    if (newSet.has(accountId)) {
      newSet.delete(accountId)
    } else {
      newSet.add(accountId)
    }
    setSelectedAccountIds(newSet)
  }

  const addHashtag = () => {
    if (newHashtag && !hashtags.includes(newHashtag)) {
      setHashtags([...hashtags, newHashtag.replace(/^#/, '')])
      setNewHashtag('')
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag))
  }

  const handlePublish = async () => {
    if (!episodeId || selectedAccountIds.size === 0) return

    try {
      await publishMutation.mutateAsync({
        episode_id: episodeId,
        platform_account_ids: Array.from(selectedAccountIds),
        title,
        description,
        hashtags: hashtags.map(t => `#${t}`),
        settings: {
          allow_duet: allowDuet,
          save_to_device: saveToDevice,
        },
      })
      onClose()
    } catch (error) {
      console.error('Publish failed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-[400px] h-full bg-[#101622] border-l border-[#282e39] shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#282e39] flex items-center justify-between bg-[#15191f]">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">rocket_launch</span>
              One-Click Publish
            </h2>
            <p className="text-[#9da6b9] text-xs mt-0.5">Distribute to authorized platforms</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9da6b9] hover:text-white transition-colors rounded-full hover:bg-white/10 p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Video Preview */}
          <div className="bg-[#1c1f27] rounded-xl p-3 border border-[#282e39] flex gap-4 hover:border-border-dark/80 transition-colors">
            <div className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden relative shrink-0">
              {thumbnailUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{ backgroundImage: `url("${thumbnailUrl}")`, filter: 'brightness(0.9)' }}
                ></div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600"></div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/90 text-2xl drop-shadow-md">play_circle</span>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <h4 className="text-white text-sm font-bold truncate">{episodeTitle}</h4>
              <p className="text-[#9da6b9] text-xs">{duration} • 1080p • 60fps</p>
              <span className="inline-flex items-center gap-1 text-green-400 text-xs mt-1 bg-green-400/10 px-2 py-0.5 rounded w-fit border border-green-400/20">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Ready
              </span>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider block mb-3">
              Target Platforms
            </label>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              </div>
            ) : connectedAccounts.length === 0 ? (
              <div className="text-center py-4 text-[#9da6b9] text-sm">
                No connected platforms. Go to Distribution to connect accounts.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {connectedAccounts.map(account => {
                  const config = getPlatformConfig(account.platform)
                  const isSelected = selectedAccountIds.has(account.id)

                  return (
                    <button
                      key={account.id}
                      onClick={() => toggleAccount(account.id)}
                      className={`group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all relative ${
                        isSelected
                          ? 'border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20'
                          : 'border-[#282e39] bg-[#1c1f27] hover:border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 text-purple-500">
                          <span className="material-symbols-outlined text-[16px] icon-filled">check_circle</span>
                        </div>
                      )}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: config.color }}
                      >
                        <span className="material-symbols-outlined">{config.icon}</span>
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-purple-200' : 'text-[#9da6b9] group-hover:text-white'}`}>
                        {config.name.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider">Video Title</label>
              <input
                className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-[#9da6b9]/50 transition-colors"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider">Description</label>
              <textarea
                className="w-full h-24 bg-[#1c1f27] border border-[#282e39] rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-[#9da6b9]/50 resize-none transition-colors"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your video..."
              ></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider">Hashtags</label>
              <div className="flex flex-wrap gap-2 bg-[#1c1f27] border border-[#282e39] rounded-lg p-2 min-h-[42px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="bg-primary/20 text-blue-200 border border-primary/20 text-xs px-2 py-1 rounded flex items-center gap-1"
                  >
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-white">
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </span>
                ))}
                <input
                  className="bg-transparent border-none outline-none text-white text-xs w-20 p-0 h-5 focus:ring-0 placeholder-[#9da6b9]/50"
                  placeholder="Add tag..."
                  type="text"
                  value={newHashtag}
                  onChange={e => setNewHashtag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addHashtag()}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2 border-t border-[#282e39]">
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setAllowDuet(!allowDuet)}>
              <span className="text-sm text-white font-medium group-hover:text-primary transition-colors">Allow Duet / Remix</span>
              <button className={`w-9 h-5 ${allowDuet ? 'bg-primary' : 'bg-[#282e39] border border-border-dark'} rounded-full relative transition-colors`}>
                <div className={`absolute ${allowDuet ? 'right-1' : 'left-1'} top-1 w-3 h-3 ${allowDuet ? 'bg-white' : 'bg-[#9da6b9]'} rounded-full shadow-sm`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setSaveToDevice(!saveToDevice)}>
              <span className="text-sm text-white font-medium group-hover:text-primary transition-colors">Save to Device</span>
              <button className={`w-9 h-5 ${saveToDevice ? 'bg-primary' : 'bg-[#282e39] border border-border-dark'} rounded-full relative transition-colors`}>
                <div className={`absolute ${saveToDevice ? 'right-1' : 'left-1'} top-1 w-3 h-3 ${saveToDevice ? 'bg-white' : 'bg-[#9da6b9]'} rounded-full shadow-sm`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#282e39] bg-[#15191f]">
          <button
            onClick={handlePublish}
            disabled={selectedAccountIds.size === 0 || publishMutation.isPending || !episodeId}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl h-12 font-bold text-base shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishMutation.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined icon-filled">rocket_launch</span>
                <span>Publish to Selected ({selectedAccountIds.size})</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-[#9da6b9] text-center mt-3">
            By publishing, you agree to the content policies of selected platforms.
          </p>
        </div>
      </div>
    </div>
  )
}
