import { apiClient } from './client'

export interface Provider {
  id: string
  service_type: string
  name: string
  description?: string
  is_local: boolean
  requires_gpu: boolean
  default_endpoint?: string
  config_schema?: Record<string, unknown>
}

export interface UserConfig {
  id: string
  user_id: string
  service_type: string
  provider: string
  endpoint?: string
  model?: string
  settings?: Record<string, unknown>
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
  has_api_key: boolean
}

export interface UserConfigCreate {
  service_type: string
  provider: string
  api_key?: string
  endpoint?: string
  model?: string
  settings?: Record<string, unknown>
  priority?: number
}

export interface UserConfigUpdate {
  api_key?: string
  endpoint?: string
  model?: string
  settings?: Record<string, unknown>
  is_active?: boolean
  priority?: number
}

export interface TestConnectionRequest {
  service_type: string
  provider: string
  api_key: string
  endpoint?: string
  model?: string
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  available_models?: string[]
}

export const configApi = {
  listProviders: async (serviceType?: string): Promise<Provider[]> => {
    const params = serviceType ? `?service_type=${serviceType}` : ''
    const response = await apiClient.get<Provider[]>(`/config/providers${params}`)
    return response.data
  },

  listUserConfigs: async (serviceType?: string): Promise<UserConfig[]> => {
    const params = serviceType ? `?service_type=${serviceType}` : ''
    const response = await apiClient.get<UserConfig[]>(`/config${params}`)
    return response.data
  },

  createConfig: async (data: UserConfigCreate): Promise<UserConfig> => {
    const response = await apiClient.post<UserConfig>('/config', data)
    return response.data
  },

  updateConfig: async (id: string, data: UserConfigUpdate): Promise<UserConfig> => {
    const response = await apiClient.patch<UserConfig>(`/config/${id}`, data)
    return response.data
  },

  deleteConfig: async (id: string): Promise<void> => {
    await apiClient.delete(`/config/${id}`)
  },

  testConnection: async (data: TestConnectionRequest): Promise<TestConnectionResponse> => {
    const response = await apiClient.post<TestConnectionResponse>('/config/test', data)
    return response.data
  },
}
