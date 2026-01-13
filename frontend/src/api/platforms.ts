import { apiClient } from './client'

// =============================================
// Platform Info Types
// =============================================

export interface PlatformInfo {
  id: string
  name: string
  icon: string
  color: string
  supports_scheduling: boolean
  supports_hashtags: boolean
  supports_subtitles: boolean
  max_video_duration: number
  max_title_length: number
  max_description_length: number
}

// =============================================
// Platform Account Types
// =============================================

export interface PlatformAccount {
  id: string
  user_id: string
  platform: string
  account_name: string
  platform_user_id?: string
  status: 'connected' | 'expired' | 'disconnected' | 'error'
  settings: Record<string, unknown>
  auto_publish: boolean
  token_expires_at?: string
  has_access_token: boolean
  created_at: string
  updated_at: string
}

export interface PlatformAccountCreate {
  platform: string
  account_name: string
  platform_user_id?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  settings?: Record<string, unknown>
}

export interface PlatformAccountUpdate {
  account_name?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  status?: 'connected' | 'expired' | 'disconnected' | 'error'
  settings?: Record<string, unknown>
  auto_publish?: boolean
}

// =============================================
// Publishing Types
// =============================================

export interface PublishRequest {
  episode_id: string
  platform_account_ids: string[]
  title: string
  description?: string
  hashtags?: string[]
  scheduled_at?: string
  settings?: Record<string, unknown>
}

export interface PublishRecord {
  id: string
  platform_account_id: string
  episode_id: string
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'deleted'
  platform_video_id?: string
  platform_video_url?: string
  title: string
  description?: string
  hashtags: string[]
  publish_settings: Record<string, unknown>
  error_message?: string
  published_at?: string
  created_at: string
  updated_at: string
  platform?: string
  account_name?: string
}

export interface PublishStatusResponse {
  total: number
  published: number
  pending: number
  failed: number
  records: PublishRecord[]
}

export interface BatchPublishResponse {
  success: boolean
  message: string
  records: PublishRecord[]
}

// =============================================
// API Functions
// =============================================

export const platformsApi = {
  // Platform Info
  listSupportedPlatforms: async (): Promise<PlatformInfo[]> => {
    const response = await apiClient.get<PlatformInfo[]>('/platforms/supported')
    return response.data
  },

  // Platform Accounts
  listAccounts: async (platform?: string): Promise<PlatformAccount[]> => {
    const params = platform ? `?platform=${platform}` : ''
    const response = await apiClient.get<PlatformAccount[]>(`/platforms/accounts${params}`)
    return response.data
  },

  createAccount: async (data: PlatformAccountCreate): Promise<PlatformAccount> => {
    const response = await apiClient.post<PlatformAccount>('/platforms/accounts', data)
    return response.data
  },

  getAccount: async (id: string): Promise<PlatformAccount> => {
    const response = await apiClient.get<PlatformAccount>(`/platforms/accounts/${id}`)
    return response.data
  },

  updateAccount: async (id: string, data: PlatformAccountUpdate): Promise<PlatformAccount> => {
    const response = await apiClient.patch<PlatformAccount>(`/platforms/accounts/${id}`, data)
    return response.data
  },

  deleteAccount: async (id: string): Promise<void> => {
    await apiClient.delete(`/platforms/accounts/${id}`)
  },

  refreshToken: async (id: string): Promise<PlatformAccount> => {
    const response = await apiClient.post<PlatformAccount>(`/platforms/accounts/${id}/refresh-token`)
    return response.data
  },

  // Publishing
  publish: async (data: PublishRequest): Promise<BatchPublishResponse> => {
    const response = await apiClient.post<BatchPublishResponse>('/platforms/publish', data)
    return response.data
  },

  listPublishHistory: async (options?: {
    episode_id?: string
    platform?: string
    status?: string
    limit?: number
  }): Promise<PublishRecord[]> => {
    const params = new URLSearchParams()
    if (options?.episode_id) params.append('episode_id', options.episode_id)
    if (options?.platform) params.append('platform', options.platform)
    if (options?.status) params.append('status_filter', options.status)
    if (options?.limit) params.append('limit', options.limit.toString())

    const queryString = params.toString()
    const response = await apiClient.get<PublishRecord[]>(
      `/platforms/publish/history${queryString ? `?${queryString}` : ''}`
    )
    return response.data
  },

  getPublishRecord: async (id: string): Promise<PublishRecord> => {
    const response = await apiClient.get<PublishRecord>(`/platforms/publish/${id}`)
    return response.data
  },

  getPublishStatus: async (episodeId: string): Promise<PublishStatusResponse> => {
    const response = await apiClient.get<PublishStatusResponse>(`/platforms/publish/status/${episodeId}`)
    return response.data
  },
}
