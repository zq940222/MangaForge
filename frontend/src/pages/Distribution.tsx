import { useState } from 'react'
import { usePlatformAccounts, useRefreshPlatformToken, useCreatePlatformAccount, useUpdatePlatformAccount, getPlatformConfig } from '../hooks/usePlatforms'
import type { PlatformAccount } from '../api/platforms'

// Platform card component
function PlatformCard({
  account,
  onRefreshToken,
  onUpdateSettings,
  isRefreshing,
}: {
  account: PlatformAccount
  onRefreshToken: (id: string) => void
  onUpdateSettings: (id: string, settings: Record<string, unknown>) => void
  isRefreshing: boolean
}) {
  const config = getPlatformConfig(account.platform)
  const isConnected = account.status === 'connected'
  const isExpired = account.status === 'expired'
  const isDisconnected = account.status === 'disconnected' || account.status === 'error'

  const borderClass = isConnected
    ? 'border-primary/30 hover:border-primary/50'
    : isExpired
      ? 'border-amber-500/30 hover:border-amber-500/50'
      : 'border-border-dark hover:border-slate-500'

  const shadowClass = isConnected
    ? 'shadow-[0_0_15px_rgba(19,91,236,0.05)]'
    : isExpired
      ? 'shadow-[0_0_15px_rgba(245,158,11,0.05)]'
      : ''

  return (
    <div className={`bg-surface-dark border ${borderClass} rounded-xl p-5 ${shadowClass} flex flex-col gap-5 relative overflow-hidden group transition-colors`}>
      {/* Status indicator */}
      <div className="absolute top-0 right-0 p-3">
        <span className="flex h-3 w-3 relative">
          {isConnected && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </>
          )}
          {isExpired && (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          )}
          {isDisconnected && (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-700"></span>
          )}
        </span>
      </div>

      {/* Platform info */}
      <div className={`flex items-center gap-4 ${isDisconnected ? 'grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}>
        <div
          className="size-14 rounded-xl flex items-center justify-center p-1 border border-white/10"
          style={{ backgroundColor: config.color }}
        >
          <span className="material-symbols-outlined text-white text-3xl">{config.icon}</span>
        </div>
        <div>
          <h4 className="text-white font-bold text-lg">{config.name}</h4>
          {isConnected && (
            <p className="text-emerald-400 text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Connected as @{account.account_name}
            </p>
          )}
          {isExpired && (
            <p className="text-amber-500 text-sm flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-sm">warning</span>
              Token Expired
            </p>
          )}
          {isDisconnected && (
            <p className="text-slate-500 text-sm flex items-center gap-1">
              Not Linked
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-white/5 w-full"></div>

      {/* Settings toggles */}
      {isConnected && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between cursor-pointer group/toggle">
            <div className="flex items-center gap-2 text-slate-300 group-hover/toggle:text-white transition-colors text-sm">
              <span className="material-symbols-outlined text-lg text-slate-500">tag</span>
              Auto-add Hashtags
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={account.settings?.auto_hashtags !== false}
                onChange={(e) => {
                  onUpdateSettings(account.id, {
                    ...account.settings,
                    auto_hashtags: e.target.checked,
                  })
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer group/toggle">
            <div className="flex items-center gap-2 text-slate-300 group-hover/toggle:text-white transition-colors text-sm">
              <span className="material-symbols-outlined text-lg text-slate-500">subtitles</span>
              Sync Subtitles
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={account.settings?.sync_subtitles !== false}
                onChange={(e) => {
                  onUpdateSettings(account.id, {
                    ...account.settings,
                    sync_subtitles: e.target.checked,
                  })
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
        </div>
      )}

      {isExpired && (
        <div className="flex flex-col gap-3 opacity-50 pointer-events-none grayscale">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="material-symbols-outlined text-lg text-slate-500">tag</span>
              Auto-add Hashtags
            </div>
            <div className="w-11 h-6 bg-slate-700 rounded-full relative after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5"></div>
          </label>
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="material-symbols-outlined text-lg text-slate-500">schedule</span>
              Timed Release
            </div>
            <div className="w-11 h-6 bg-slate-700 rounded-full relative after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5"></div>
          </label>
        </div>
      )}

      {isDisconnected && (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
          <span className="material-symbols-outlined text-4xl text-slate-700">link_off</span>
          <p className="text-slate-500 text-sm">Connect account to enable publishing</p>
        </div>
      )}

      {/* Action button */}
      <div className="mt-auto pt-2">
        {isConnected && (
          <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-transparent hover:border-white/10">
            Manage Configuration
          </button>
        )}
        {isExpired && (
          <button
            onClick={() => onRefreshToken(account.id)}
            disabled={isRefreshing}
            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
          </button>
        )}
        {isDisconnected && (
          <button className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">add_link</span>
            Authorize
          </button>
        )}
      </div>
    </div>
  )
}

// Empty platform card for platforms not yet added
function EmptyPlatformCard({
  platformId,
  onAuthorize,
}: {
  platformId: string
  onAuthorize: (platformId: string) => void
}) {
  const config = getPlatformConfig(platformId)

  return (
    <div className="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col gap-5 relative overflow-hidden group hover:border-slate-500 transition-colors">
      <div className="absolute top-0 right-0 p-3">
        <span className="flex h-3 w-3 relative">
          <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-700"></span>
        </span>
      </div>

      <div className="flex items-center gap-4 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
        <div
          className="size-14 rounded-xl flex items-center justify-center p-1 border border-white/10"
          style={{ backgroundColor: config.color }}
        >
          <span className="material-symbols-outlined text-white text-3xl">{config.icon}</span>
        </div>
        <div>
          <h4 className="text-white font-bold text-lg">{config.name}</h4>
          <p className="text-slate-500 text-sm flex items-center gap-1">
            Not Linked
          </p>
        </div>
      </div>

      <div className="h-px bg-white/5 w-full"></div>

      <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
        <span className="material-symbols-outlined text-4xl text-slate-700">link_off</span>
        <p className="text-slate-500 text-sm">Connect account to enable publishing</p>
      </div>

      <div className="mt-auto pt-2">
        <button
          onClick={() => onAuthorize(platformId)}
          className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_link</span>
          Authorize
        </button>
      </div>
    </div>
  )
}

export function Distribution() {
  const { data: accounts, isLoading, error } = usePlatformAccounts()
  const refreshTokenMutation = useRefreshPlatformToken()
  const createAccountMutation = useCreatePlatformAccount()
  const updateAccountMutation = useUpdatePlatformAccount()
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const handleRefreshToken = async (id: string) => {
    setRefreshingId(id)
    try {
      await refreshTokenMutation.mutateAsync(id)
    } finally {
      setRefreshingId(null)
    }
  }

  const handleUpdateSettings = (id: string, settings: Record<string, unknown>) => {
    updateAccountMutation.mutate({ id, data: { settings } })
  }

  const handleAuthorize = (platformId: string) => {
    // TODO: Implement OAuth flow
    // For now, create a mock account
    createAccountMutation.mutate({
      platform: platformId,
      account_name: 'NewAccount',
      settings: {},
    })
  }

  // All supported platforms
  const supportedPlatforms = ['douyin', 'bilibili', 'kuaishou', 'wechat_channels']

  // Get accounts by platform
  const accountsByPlatform = new Map<string, PlatformAccount>()
  accounts?.forEach(acc => {
    accountsByPlatform.set(acc.platform, acc)
  })

  // Count stats
  const connectedCount = accounts?.filter(a => a.status === 'connected').length || 0
  const expiredCount = accounts?.filter(a => a.status === 'expired').length || 0

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Project
          </div>
          <h2 className="text-white text-3xl font-bold leading-tight">Publish & Distribution</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-surface-dark hover:bg-border-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border-dark flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">history</span>
            History
          </button>
        </div>
      </div>

      {/* Headline Context */}
      <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="flex gap-5 items-center">
          <div className="bg-center bg-no-repeat w-32 h-20 rounded-lg bg-cover shadow-md border border-white/10 relative overflow-hidden group bg-gradient-to-br from-purple-600 to-blue-600">
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white">play_circle</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-text-secondary text-sm font-medium">Ready for distribution</p>
            <h3 className="text-white text-2xl font-bold tracking-tight">Episode 12 - The Neon Samurai</h3>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">4K</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">60 FPS</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">EN/CN Subs</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-border-dark hover:bg-white/5 text-white text-sm font-medium transition-colors">Preview Video</button>
          <button className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-border-dark hover:bg-white/5 text-white text-sm font-medium transition-colors">Edit Metadata</button>
        </div>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          Failed to load platform accounts. Please try again.
        </div>
      )}

      {/* Platforms Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {supportedPlatforms.map(platformId => {
            const account = accountsByPlatform.get(platformId)
            if (account) {
              return (
                <PlatformCard
                  key={account.id}
                  account={account}
                  onRefreshToken={handleRefreshToken}
                  onUpdateSettings={handleUpdateSettings}
                  isRefreshing={refreshingId === account.id}
                />
              )
            } else {
              return (
                <EmptyPlatformCard
                  key={platformId}
                  platformId={platformId}
                  onAuthorize={handleAuthorize}
                />
              )
            }
          })}
        </div>
      )}

      {/* Sticky Footer Action */}
      <div className="sticky bottom-0 border-t border-border-dark bg-[#111318]/95 backdrop-blur-xl p-4 w-full z-30 -mx-6 -mb-8 md:-mx-8 md:-mb-8 mt-auto rounded-t-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-8">
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
            <span className="hidden md:inline">
              Ready to publish to {connectedCount} platform{connectedCount !== 1 ? 's' : ''}.
              {expiredCount > 0 && ` ${expiredCount} platform${expiredCount !== 1 ? 's' : ''} need${expiredCount === 1 ? 's' : ''} attention.`}
            </span>
            <span className="md:hidden">
              {connectedCount} Ready. {expiredCount > 0 && `${expiredCount} Error.`}
            </span>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex-1 md:flex-none">Save Draft</button>
            <button
              disabled={connectedCount === 0}
              className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(19,91,236,0.4)] hover:shadow-[0_0_25px_rgba(19,91,236,0.6)] transition-all flex items-center justify-center gap-2 flex-1 md:flex-none transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Batch Publish Current Episode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
