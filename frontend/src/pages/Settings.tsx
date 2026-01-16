import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useUserConfigs,
  useProviders,
  useUpdateConfig,
  useCreateConfig,
  useTestConnection,
  getProviderDisplayInfo,
  getServiceTypeInfo,
} from '../hooks/useConfig'
import type { UserConfig, Provider, TestConnectionResponse } from '../api/config'

interface ProviderCardProps {
  provider: Provider
  existingConfig?: UserConfig
  onTest: (provider: Provider, apiKey: string, configId?: string) => void
  onSave: (provider: Provider, apiKey: string, configId?: string, model?: string) => void
  isTesting: boolean
  isSaving: boolean
  testResult?: TestConnectionResponse
}

function ProviderCard({
  provider,
  existingConfig,
  onTest,
  onSave,
  isTesting,
  isSaving,
  testResult,
}: ProviderCardProps) {
  const { t } = useTranslation()
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(existingConfig?.model || '')
  const [isDirty, setIsDirty] = useState(false)
  const providerInfo = getProviderDisplayInfo(provider.id)

  useEffect(() => {
    setSelectedModel(existingConfig?.model || '')
  }, [existingConfig?.model])

  const hasApiKey = existingConfig?.has_api_key || false
  const isActive = existingConfig?.is_active ?? false

  const getStatusColor = () => {
    if (testResult?.success) return 'bg-green-500'
    if (testResult?.success === false) return 'bg-red-500'
    if (hasApiKey) return 'bg-green-500'
    return 'bg-gray-600'
  }

  const getStatusText = () => {
    if (testResult?.success) return t('settings.connectionStatus.connected')
    if (testResult?.success === false) return t('settings.connectionStatus.authError')
    if (hasApiKey) return t('settings.connectionStatus.configured')
    return t('settings.connectionStatus.notConfigured')
  }

  const getStatusTextColor = () => {
    if (testResult?.success) return 'text-green-400'
    if (testResult?.success === false) return 'text-red-400'
    if (hasApiKey) return 'text-green-400'
    return 'text-text-secondary'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined ${providerInfo.iconColor}`}>{providerInfo.icon}</span>
          <span className="font-bold text-sm">{providerInfo.name}</span>
          {provider.is_local && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Local
            </span>
          )}
          {isActive && hasApiKey && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${getStatusColor()} ${hasApiKey && !testResult ? 'animate-pulse' : ''}`}></span>
          <span className={`text-xs font-medium ${getStatusTextColor()}`}>{getStatusText()}</span>
        </div>
      </div>

      {provider.description && (
        <p className="text-xs text-text-secondary">{provider.description}</p>
      )}

      {/* API Key / Endpoint */}
      {!provider.is_local ? (
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('settings.apiKey')}</label>
          <div className="relative">
            <input
              className={`w-full bg-background-dark border ${testResult?.success === false ? 'border-red-500/50' : 'border-border-dark'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono`}
              placeholder={hasApiKey ? '••••••••••••••••' : t('settings.enterApiKey')}
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">
                {showApiKey ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('settings.endpoint')}</label>
          <div className="text-sm text-text-secondary font-mono bg-background-dark/50 px-3 py-2 rounded border border-border-dark">
            {provider.default_endpoint || t('settings.connectionStatus.notConfigured')}
          </div>
        </div>
      )}

      {/* Model Selection - 显示可用模型列表或当前已配置的模型 */}
      {(testResult?.available_models && testResult.available_models.length > 0) ? (
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('settings.model')}</label>
          <div className="relative">
            <select
              className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value)
                setIsDirty(true)
              }}
            >
              <option value="">{t('settings.selectModel')}</option>
              {testResult.available_models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-lg">
              expand_more
            </span>
          </div>
        </div>
      ) : hasApiKey && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('settings.model')}</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white">
              {selectedModel || existingConfig?.model || t('settings.noModelSelected')}
            </div>
            <button
              onClick={() => onTest(provider, apiKey, existingConfig?.id)}
              disabled={isTesting}
              className="px-3 py-2 rounded-lg border border-border-dark hover:bg-border-dark text-text-secondary hover:text-white text-xs transition-colors disabled:opacity-50"
              title={t('settings.refreshModels')}
            >
              <span className={`material-symbols-outlined text-base ${isTesting ? 'animate-spin' : ''}`}>
                {isTesting ? 'progress_activity' : 'refresh'}
              </span>
            </button>
          </div>
          <p className="text-[10px] text-text-secondary">{t('settings.clickRefreshToChangeModel')}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onTest(provider, apiKey, existingConfig?.id)}
          disabled={isTesting || (!apiKey && !hasApiKey && !provider.is_local)}
          className="flex-1 h-[42px] flex items-center justify-center gap-2 rounded-lg border border-border-dark hover:bg-border-dark text-white text-xs font-bold transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-base ${isTesting ? 'animate-spin' : ''}`}>
            {isTesting ? 'progress_activity' : testResult?.success === false ? 'refresh' : 'wifi'}
          </span>
          {isTesting ? t('settings.testing') : testResult?.success === false ? t('settings.retry') : t('settings.testConnection')}
        </button>
        <button
          onClick={() => {
            onSave(provider, apiKey, existingConfig?.id, selectedModel)
            setApiKey('')
            setIsDirty(false)
          }}
          disabled={isSaving || (!apiKey && !isDirty && !provider.is_local)}
          className="flex-1 h-[42px] flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:bg-primary/50"
        >
          <span className={`material-symbols-outlined text-base ${isSaving ? 'animate-spin' : ''}`}>
            {isSaving ? 'progress_activity' : 'save'}
          </span>
          {isSaving ? t('settings.saving') : existingConfig ? t('settings.update') : t('common.save')}
        </button>
      </div>

      {testResult?.success === false && testResult.message && (
        <p className="text-xs text-red-400">{testResult.message}</p>
      )}

      {testResult?.success && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {t('settings.connectionSuccessful')}
        </p>
      )}
    </div>
  )
}

interface ServiceSectionProps {
  serviceType: string
  providers: Provider[]
  userConfigs: UserConfig[]
  onTest: (provider: Provider, apiKey: string, configId?: string) => void
  onSave: (provider: Provider, apiKey: string, configId?: string, model?: string) => void
  testingId: string | null
  savingId: string | null
  testResults: Record<string, TestConnectionResponse>
}

function ServiceSection({
  serviceType,
  providers,
  userConfigs,
  onTest,
  onSave,
  testingId,
  savingId,
  testResults,
}: ServiceSectionProps) {
  const { t } = useTranslation()
  const serviceInfo = getServiceTypeInfo(serviceType)

  // Create a map of provider ID to user config
  const configByProvider = new Map<string, UserConfig>()
  userConfigs.forEach(config => {
    configByProvider.set(config.provider, config)
  })

  return (
    <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col gap-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border-dark pb-4">
        <div className={`p-2 ${serviceInfo.iconBgColor} rounded-lg ${serviceInfo.iconTextColor}`}>
          <span className="material-symbols-outlined">{serviceInfo.icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{serviceInfo.name}</h3>
          <p className="text-xs text-text-secondary">{serviceInfo.description}</p>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-4 text-text-secondary text-sm">
          {t('settings.noProviders')}
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider, index) => {
            const existingConfig = configByProvider.get(provider.id)
            const cardId = existingConfig?.id || provider.id

            return (
              <div key={provider.id}>
                <ProviderCard
                  provider={provider}
                  existingConfig={existingConfig}
                  onTest={onTest}
                  onSave={onSave}
                  isTesting={testingId === cardId}
                  isSaving={savingId === cardId}
                  testResult={testResults[cardId]}
                />
                {index < providers.length - 1 && (
                  <div className="h-px bg-border-dark w-full mt-6"></div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface PriorityCardProps {
  configs: UserConfig[]
  onUpdateConfig: (id: string, data: { is_active?: boolean; priority?: number }) => Promise<void>
}

function PriorityCard({ configs, onUpdateConfig }: PriorityCardProps) {
  const { t } = useTranslation()
  const [priorityMode, setPriorityMode] = useState<'manual' | 'auto'>('manual')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Sort by priority descending
  const sortedConfigs = [...configs]
    .filter(c => c.service_type === 'llm' && c.has_api_key)
    .sort((a, b) => b.priority - a.priority)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = sortedConfigs.findIndex(c => c.id === draggedId)
    const targetIndex = sortedConfigs.findIndex(c => c.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      return
    }

    // Calculate new priorities (higher number = higher priority)
    const newOrder = [...sortedConfigs]
    const [draggedItem] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)

    // Update priorities: first item gets highest priority
    const updates = newOrder.map((config, index) => ({
      id: config.id,
      priority: newOrder.length - index, // Reverse: first gets highest
    }))

    // Apply all priority updates
    for (const update of updates) {
      if (update.priority !== sortedConfigs.find(c => c.id === update.id)?.priority) {
        await onUpdateConfig(update.id, { priority: update.priority })
      }
    }

    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const handleToggle = async (config: UserConfig) => {
    setUpdatingId(config.id)
    try {
      await onUpdateConfig(config.id, { is_active: !config.is_active })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border-dark pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg text-white">
            <span className="material-symbols-outlined">tune</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('settings.modelPriorityStrategy')}</h3>
            <p className="text-xs text-text-secondary">{t('settings.dragToReorder')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-background-dark rounded-lg p-1 border border-border-dark">
          <button
            onClick={() => setPriorityMode('manual')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${priorityMode === 'manual' ? 'bg-primary text-white' : 'hover:bg-white/5 text-text-secondary hover:text-white'}`}
          >
            {t('settings.manual')}
          </button>
          <button
            onClick={() => setPriorityMode('auto')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${priorityMode === 'auto' ? 'bg-primary text-white' : 'hover:bg-white/5 text-text-secondary hover:text-white'}`}
          >
            {t('settings.autoOptimize')}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {sortedConfigs.map((config, index) => {
          const providerInfo = getProviderDisplayInfo(config.provider)
          const isActive = config.is_active && config.has_api_key
          const isDragging = draggedId === config.id
          const isUpdating = updatingId === config.id

          return (
            <div
              key={config.id}
              draggable={priorityMode === 'manual'}
              onDragStart={(e) => handleDragStart(e, config.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, config.id)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-4 bg-background-dark border border-border-dark hover:border-primary/50 p-3 rounded-lg transition-all ${!isActive ? 'opacity-70' : ''} ${priorityMode === 'manual' ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50 border-primary' : ''}`}
            >
              <span className={`material-symbols-outlined text-text-secondary group-hover:text-white ${priorityMode !== 'manual' ? 'opacity-30' : ''}`}>drag_indicator</span>
              <div className={`h-8 w-8 rounded ${index === 0 && isActive ? 'bg-green-500/20 text-green-500' : 'bg-border-dark text-text-secondary'} flex items-center justify-center font-bold text-xs`}>
                {index + 1}
              </div>
              <div className="flex flex-col flex-1">
                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                  {providerInfo.name} {config.model ? `(${config.model})` : ''}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {index === 0 ? t('settings.primaryEngine') : t('settings.fallbackEngine')}
                </span>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-secondary">{t('settings.status')}</span>
                  <span className={`text-xs font-mono ${isActive ? 'text-green-400' : 'text-text-secondary'}`}>
                    {isActive ? t('settings.ready') : t('common.offline')}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(config)}
                  disabled={isUpdating}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.is_active ? 'bg-primary' : 'bg-border-dark'} ${isUpdating ? 'opacity-50' : 'cursor-pointer hover:opacity-80'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${config.is_active ? 'translate-x-5' : 'translate-x-1'}`}></span>
                </button>
              </div>
            </div>
          )
        })}

        {sortedConfigs.length === 0 && (
          <div className="text-center py-4 text-text-secondary text-sm">
            {t('settings.configureLlmFirst')}
          </div>
        )}
      </div>
    </div>
  )
}

export function Settings() {
  const { t } = useTranslation()
  const { data: configs, isLoading: configsLoading } = useUserConfigs()
  const { data: providers, isLoading: providersLoading } = useProviders()
  const testConnectionMutation = useTestConnection()
  const updateConfigMutation = useUpdateConfig()
  const createConfigMutation = useCreateConfig()

  const [testingId, setTestingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResponse>>({})
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Store API keys temporarily for testing
  const [tempApiKeys, setTempApiKeys] = useState<Record<string, string>>({})

  const handleTest = async (provider: Provider, apiKey: string, configId?: string) => {
    const cardId = configId || provider.id
    setTestingId(cardId)

    // Store the API key temporarily
    if (apiKey) {
      setTempApiKeys(prev => ({ ...prev, [cardId]: apiKey }))
    }

    try {
      const keyToUse = apiKey || tempApiKeys[cardId] || ''
      const result = await testConnectionMutation.mutateAsync({
        service_type: provider.service_type,
        provider: provider.id,
        api_key: keyToUse,
        endpoint: provider.default_endpoint,
      })
      setTestResults(prev => ({ ...prev, [cardId]: result }))
    } catch {
      setTestResults(prev => ({
        ...prev,
        [cardId]: { success: false, message: 'Connection failed' },
      }))
    } finally {
      setTestingId(null)
    }
  }

  const handleSave = async (provider: Provider, apiKey: string, configId?: string, model?: string) => {
    const cardId = configId || provider.id
    setSavingId(cardId)

    try {
      if (configId) {
        // Update existing config
        await updateConfigMutation.mutateAsync({
          id: configId,
          data: {
            ...(apiKey && { api_key: apiKey }),
            ...(model && { model }),
          },
        })
      } else {
        // Create new config
        await createConfigMutation.mutateAsync({
          service_type: provider.service_type,
          provider: provider.id,
          api_key: apiKey,
          endpoint: provider.default_endpoint,
          model: model,
        })
      }

      setSaveSuccess(cardId)
      // Clear temp API key after save
      setTempApiKeys(prev => {
        const newKeys = { ...prev }
        delete newKeys[cardId]
        return newKeys
      })
      setTimeout(() => setSaveSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSavingId(null)
    }
  }

  // Group providers by service type
  const providersByType: Record<string, Provider[]> = {}
  providers?.forEach(p => {
    if (!providersByType[p.service_type]) {
      providersByType[p.service_type] = []
    }
    providersByType[p.service_type].push(p)
  })

  // Group configs by service type
  const configsByType: Record<string, UserConfig[]> = {}
  configs?.forEach(c => {
    if (!configsByType[c.service_type]) {
      configsByType[c.service_type] = []
    }
    configsByType[c.service_type].push(c)
  })

  // Service types to display
  const serviceTypes = ['llm', 'image', 'video', 'voice', 'lipsync']

  // Handler for updating config priority and is_active
  const handleUpdateConfig = async (id: string, data: { is_active?: boolean; priority?: number }) => {
    await updateConfigMutation.mutateAsync({ id, data })
  }

  const isLoading = configsLoading || providersLoading

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('settings.pageTitle')}</h1>
            <p className="text-text-secondary text-base font-normal leading-relaxed">
              {t('settings.pageDescription')}
            </p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {t('settings.configSavedSuccessfully')}
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        )}

        {/* Service Sections */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-6">
            {serviceTypes.map(serviceType => (
              <ServiceSection
                key={serviceType}
                serviceType={serviceType}
                providers={providersByType[serviceType] || []}
                userConfigs={configsByType[serviceType] || []}
                onTest={handleTest}
                onSave={handleSave}
                testingId={testingId}
                savingId={savingId}
                testResults={testResults}
              />
            ))}

            {/* Priority Card */}
            <PriorityCard configs={configs || []} onUpdateConfig={handleUpdateConfig} />
          </div>
        )}
      </div>
    </div>
  )
}
