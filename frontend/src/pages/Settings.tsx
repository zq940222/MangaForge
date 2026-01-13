import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Check, X, Loader2 } from 'lucide-react'
import { configApi, Provider, UserConfig, UserConfigCreate, TestConnectionRequest } from '../api/config'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Modal } from '../components/common/Modal'

type ServiceType = 'llm' | 'image' | 'video' | 'voice' | 'lipsync'

const serviceTypeLabels: Record<ServiceType, string> = {
  llm: 'AI 大模型',
  image: '图像生成',
  video: '视频生成',
  voice: '语音合成',
  lipsync: '口型同步',
}

export function Settings() {
  const [activeService, setActiveService] = useState<ServiceType>('llm')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [newConfig, setNewConfig] = useState<UserConfigCreate>({
    service_type: 'llm',
    provider: '',
    api_key: '',
    endpoint: '',
    model: '',
    priority: 1,
  })

  const queryClient = useQueryClient()

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['providers', activeService],
    queryFn: () => configApi.listProviders(activeService),
  })

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['configs', activeService],
    queryFn: () => configApi.listUserConfigs(activeService),
  })

  const createMutation = useMutation({
    mutationFn: (data: UserConfigCreate) => configApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] })
      setIsAddModalOpen(false)
      setNewConfig({
        service_type: activeService,
        provider: '',
        api_key: '',
        endpoint: '',
        model: '',
        priority: 1,
      })
      setTestResult(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => configApi.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    },
  })

  const testMutation = useMutation({
    mutationFn: (data: TestConnectionRequest) => configApi.testConnection(data),
    onSuccess: (result) => {
      setTestResult(result)
    },
    onError: (error: Error) => {
      setTestResult({ success: false, message: error.message })
    },
  })

  const handleTest = () => {
    if (!newConfig.provider || !newConfig.api_key) return
    testMutation.mutate({
      service_type: newConfig.service_type,
      provider: newConfig.provider,
      api_key: newConfig.api_key,
      endpoint: newConfig.endpoint || undefined,
      model: newConfig.model || undefined,
    })
  }

  const selectedProvider = providers?.find((p) => p.name === newConfig.provider)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API 设置</h1>
      </div>

      {/* Service Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(serviceTypeLabels) as ServiceType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveService(type)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeService === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {serviceTypeLabels[type]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Providers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">可用服务商</h3>
          </div>

          {providersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : providers?.length === 0 ? (
            <p className="text-gray-400 text-center py-4">暂无可用服务商</p>
          ) : (
            <div className="space-y-3">
              {providers?.map((provider) => (
                <div
                  key={provider.id}
                  className="p-4 bg-gray-700/50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-gray-400">
                      {provider.description}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {provider.is_local && (
                        <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs">
                          本地
                        </span>
                      )}
                      {provider.requires_gpu && (
                        <span className="px-1.5 py-0.5 bg-yellow-900/50 text-yellow-400 rounded text-xs">
                          需要 GPU
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewConfig({
                        ...newConfig,
                        service_type: activeService,
                        provider: provider.name,
                        endpoint: provider.default_endpoint || '',
                      })
                      setIsAddModalOpen(true)
                    }}
                    className="btn btn-secondary"
                  >
                    配置
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configured Services */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">已配置服务</h3>
            <button
              onClick={() => {
                setNewConfig({
                  service_type: activeService,
                  provider: '',
                  api_key: '',
                  endpoint: '',
                  model: '',
                  priority: 1,
                })
                setIsAddModalOpen(true)
              }}
              className="btn btn-primary btn-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>

          {configsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : configs?.length === 0 ? (
            <p className="text-gray-400 text-center py-4">暂无配置</p>
          ) : (
            <div className="space-y-3">
              {configs?.map((config) => (
                <div
                  key={config.id}
                  className="p-4 bg-gray-700/50 rounded-lg flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.provider}</span>
                      {config.is_active && (
                        <span className="px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">
                          启用
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {config.model || config.endpoint || '默认配置'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {config.has_api_key ? '已配置 API Key' : '未配置 API Key'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('确定要删除此配置吗？')) {
                        deleteMutation.mutate(config.id)
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Config Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setTestResult(null)
        }}
        title="添加服务配置"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">服务商 *</label>
            <select
              className="input"
              value={newConfig.provider}
              onChange={(e) => {
                const provider = providers?.find((p) => p.name === e.target.value)
                setNewConfig({
                  ...newConfig,
                  provider: e.target.value,
                  endpoint: provider?.default_endpoint || '',
                })
                setTestResult(null)
              }}
            >
              <option value="">选择服务商</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">API Key *</label>
            <input
              type="password"
              className="input"
              placeholder="输入 API Key"
              value={newConfig.api_key}
              onChange={(e) => {
                setNewConfig({ ...newConfig, api_key: e.target.value })
                setTestResult(null)
              }}
            />
          </div>

          <div>
            <label className="label">API 端点</label>
            <input
              type="text"
              className="input"
              placeholder={selectedProvider?.default_endpoint || '使用默认端点'}
              value={newConfig.endpoint}
              onChange={(e) => setNewConfig({ ...newConfig, endpoint: e.target.value })}
            />
          </div>

          <div>
            <label className="label">模型</label>
            <input
              type="text"
              className="input"
              placeholder="模型名称（可选）"
              value={newConfig.model}
              onChange={(e) => setNewConfig({ ...newConfig, model: e.target.value })}
            />
          </div>

          <div>
            <label className="label">优先级</label>
            <input
              type="number"
              className="input"
              min={1}
              max={100}
              value={newConfig.priority}
              onChange={(e) => setNewConfig({ ...newConfig, priority: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-gray-500 mt-1">数字越大优先级越高</p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                testResult.success
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}
            >
              {testResult.success ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
              <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                {testResult.message}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={handleTest}
              disabled={!newConfig.provider || !newConfig.api_key || testMutation.isPending}
              className="btn btn-secondary flex items-center gap-2"
            >
              {testMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              测试连接
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setTestResult(null)
                }}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => createMutation.mutate(newConfig)}
                disabled={!newConfig.provider || !newConfig.api_key || createMutation.isPending}
                className="btn btn-primary disabled:opacity-50"
              >
                {createMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
