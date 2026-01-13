import { useState, useEffect } from 'react'
import {
  useUserConfigs,
  useProviders,
  useUpdateConfig,
  useTestConnection,
  groupConfigsByServiceType,
  getProviderDisplayInfo,
  getServiceTypeInfo,
} from '../hooks/useConfig'
import type { UserConfig, TestConnectionResponse } from '../api/config'

interface ConfigCardProps {
  config: UserConfig
  onTest: (config: UserConfig, apiKey: string) => void
  onSave: (id: string, apiKey: string, model?: string) => void
  isTesting: boolean
  isSaving: boolean
  testResult?: TestConnectionResponse
}

function ConfigItem({
  config,
  onTest,
  onSave,
  isTesting,
  isSaving,
  testResult,
}: ConfigCardProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(config.model || '')
  const [isDirty, setIsDirty] = useState(false)
  const providerInfo = getProviderDisplayInfo(config.provider)

  useEffect(() => {
    setSelectedModel(config.model || '')
  }, [config.model])

  const getStatusColor = () => {
    if (testResult?.success) return 'bg-green-500'
    if (testResult?.success === false) return 'bg-red-500'
    if (config.has_api_key) return 'bg-green-500'
    return 'bg-gray-600'
  }

  const getStatusText = () => {
    if (testResult?.success) return 'Connected'
    if (testResult?.success === false) return 'Auth Error'
    if (config.has_api_key) return 'Configured'
    return 'Not Configured'
  }

  const getStatusTextColor = () => {
    if (testResult?.success) return 'text-green-400'
    if (testResult?.success === false) return 'text-red-400'
    if (config.has_api_key) return 'text-green-400'
    return 'text-text-secondary'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{providerInfo.name}</span>
          {config.is_active && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${getStatusColor()} ${config.has_api_key && !testResult ? 'animate-pulse' : ''}`}></span>
          <span className={`text-xs font-medium ${getStatusTextColor()}`}>{getStatusText()}</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">API Key</label>
        <div className="relative">
          <input
            className={`w-full bg-background-dark border ${testResult?.success === false ? 'border-red-500/50' : 'border-border-dark'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono`}
            placeholder={config.has_api_key ? '••••••••••••••••' : 'Enter API key...'}
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">
              {showApiKey ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </div>

      {config.model && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Model</label>
          <div className="relative">
            <select
              className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value)
                setIsDirty(true)
              }}
            >
              <option value={config.model}>{config.model}</option>
              {testResult?.available_models?.filter(m => m !== config.model).map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-lg">
              expand_more
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onTest(config, apiKey)}
          disabled={isTesting || (!apiKey && !config.has_api_key)}
          className="flex-1 h-[42px] flex items-center justify-center gap-2 rounded-lg border border-border-dark hover:bg-border-dark text-white text-xs font-bold transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-base ${isTesting ? 'animate-spin' : ''}`}>
            {isTesting ? 'progress_activity' : testResult?.success === false ? 'refresh' : 'wifi'}
          </span>
          {isTesting ? 'Testing...' : testResult?.success === false ? 'Retry' : 'Test Connection'}
        </button>
        <button
          onClick={() => {
            onSave(config.id, apiKey, selectedModel)
            setApiKey('')
            setIsDirty(false)
          }}
          disabled={isSaving || (!apiKey && !isDirty)}
          className="flex-1 h-[42px] flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:bg-primary/50"
        >
          <span className={`material-symbols-outlined text-base ${isSaving ? 'animate-spin' : ''}`}>
            {isSaving ? 'progress_activity' : 'save'}
          </span>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {testResult?.success === false && testResult.message && (
        <p className="text-xs text-red-400">{testResult.message}</p>
      )}

      {testResult?.success && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Connection successful
        </p>
      )}
    </div>
  )
}

interface ServiceCardProps {
  serviceType: string
  configs: UserConfig[]
  onTest: (config: UserConfig, apiKey: string) => void
  onSave: (id: string, apiKey: string, model?: string) => void
  testingId: string | null
  savingId: string | null
  testResults: Record<string, TestConnectionResponse>
}

function ServiceCard({
  serviceType,
  configs,
  onTest,
  onSave,
  testingId,
  savingId,
  testResults,
}: ServiceCardProps) {
  const serviceInfo = getServiceTypeInfo(serviceType)

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

      {configs.map((config, index) => (
        <div key={config.id}>
          <ConfigItem
            config={config}
            onTest={onTest}
            onSave={onSave}
            isTesting={testingId === config.id}
            isSaving={savingId === config.id}
            testResult={testResults[config.id]}
          />
          {index < configs.length - 1 && (
            <div className="h-px bg-border-dark w-full mt-6"></div>
          )}
        </div>
      ))}

      {configs.length === 0 && (
        <div className="text-center py-4 text-text-secondary text-sm">
          No providers configured. Add one to get started.
        </div>
      )}
    </div>
  )
}

function PriorityCard({ configs }: { configs: UserConfig[] }) {
  // Sort by priority descending
  const sortedConfigs = [...configs]
    .filter(c => c.service_type === 'llm')
    .sort((a, b) => b.priority - a.priority)

  return (
    <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border-dark pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg text-white">
            <span className="material-symbols-outlined">tune</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Model Priority Strategy</h3>
            <p className="text-xs text-text-secondary">Drag to reorder fallback preference when primary services fail</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-background-dark rounded-lg p-1 border border-border-dark">
          <button className="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold">Manual</button>
          <button className="px-3 py-1.5 rounded hover:bg-white/5 text-text-secondary hover:text-white text-xs font-bold transition-colors">Auto-Optimize</button>
        </div>
      </div>
      <div className="space-y-3">
        {sortedConfigs.map((config, index) => {
          const providerInfo = getProviderDisplayInfo(config.provider)
          const isActive = config.is_active && config.has_api_key

          return (
            <div
              key={config.id}
              className={`group flex items-center gap-4 bg-background-dark border border-border-dark hover:border-primary/50 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all ${!isActive ? 'opacity-70' : ''}`}
            >
              <span className="material-symbols-outlined text-text-secondary group-hover:text-white">drag_indicator</span>
              <div className={`h-8 w-8 rounded ${index === 0 && isActive ? 'bg-green-500/20 text-green-500' : 'bg-border-dark text-text-secondary'} flex items-center justify-center font-bold text-xs`}>
                {index + 1}
              </div>
              <div className="flex flex-col flex-1">
                <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                  {providerInfo.name} {config.model ? `(${config.model})` : ''}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {index === 0 ? 'Primary Reasoning Engine' : 'Fallback / Specialized Tasks'}
                </span>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-secondary">Status</span>
                  <span className={`text-xs font-mono ${isActive ? 'text-green-400' : 'text-text-secondary'}`}>
                    {isActive ? 'Ready' : 'Offline'}
                  </span>
                </div>
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full ${config.is_active ? 'bg-primary' : 'bg-border-dark'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${config.is_active ? 'translate-x-5' : 'translate-x-1'}`}></span>
                </div>
              </div>
            </div>
          )
        })}

        {sortedConfigs.length === 0 && (
          <div className="text-center py-4 text-text-secondary text-sm">
            No LLM providers configured yet.
          </div>
        )}
      </div>
    </div>
  )
}

export function Settings() {
  const { data: configs, isLoading: configsLoading } = useUserConfigs()
  useProviders() // Prefetch providers for potential future use
  const testConnectionMutation = useTestConnection()
  const updateConfigMutation = useUpdateConfig()

  const [testingId, setTestingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResponse>>({})
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Store API keys temporarily for testing (since we don't persist them in state)
  const [tempApiKeys, setTempApiKeys] = useState<Record<string, string>>({})

  const handleTest = async (config: UserConfig, apiKey: string) => {
    setTestingId(config.id)
    // Store the API key temporarily for this config
    if (apiKey) {
      setTempApiKeys(prev => ({ ...prev, [config.id]: apiKey }))
    }
    try {
      const keyToUse = apiKey || tempApiKeys[config.id] || ''
      const result = await testConnectionMutation.mutateAsync({
        service_type: config.service_type,
        provider: config.provider,
        api_key: keyToUse,
        endpoint: config.endpoint,
        model: config.model,
      })
      setTestResults(prev => ({ ...prev, [config.id]: result }))
    } catch {
      setTestResults(prev => ({
        ...prev,
        [config.id]: { success: false, message: 'Connection failed' },
      }))
    } finally {
      setTestingId(null)
    }
  }

  const handleSave = async (id: string, apiKey: string, model?: string) => {
    setSavingId(id)
    try {
      await updateConfigMutation.mutateAsync({
        id,
        data: {
          ...(apiKey && { api_key: apiKey }),
          ...(model && { model }),
        },
      })
      setSaveSuccess(id)
      // Clear the temp API key after successful save
      setTempApiKeys(prev => {
        const newKeys = { ...prev }
        delete newKeys[id]
        return newKeys
      })
      setTimeout(() => setSaveSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSavingId(null)
    }
  }

  const groupedConfigs = configs ? groupConfigsByServiceType(configs) : {}

  // Service types to display
  const serviceTypes = ['llm', 'image', 'video', 'voice', 'lipsync']

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Agent Neural Configuration</h1>
            <p className="text-text-secondary text-base font-normal leading-relaxed">
              Manage the external cognitive services that power your MangaForge agent.
              Configure API keys for LLMs, image synthesis, video generation, and voice cloning models.
            </p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Configuration saved successfully
            </div>
          )}
        </div>

        {/* Loading state */}
        {configsLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        )}

        {/* Service Cards */}
        {!configsLoading && (
          <div className="grid grid-cols-1 gap-6">
            {serviceTypes.map(serviceType => (
              <ServiceCard
                key={serviceType}
                serviceType={serviceType}
                configs={groupedConfigs[serviceType] || []}
                onTest={handleTest}
                onSave={handleSave}
                testingId={testingId}
                savingId={savingId}
                testResults={testResults}
              />
            ))}

            {/* Priority Card */}
            <PriorityCard configs={configs || []} />
          </div>
        )}
      </div>
    </div>
  )
}
