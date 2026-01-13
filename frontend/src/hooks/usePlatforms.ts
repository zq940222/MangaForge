import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  platformsApi,
  PlatformAccountCreate,
  PlatformAccountUpdate,
  PublishRequest,
} from '../api/platforms'
import type { PlatformAccount, PlatformInfo, PublishRecord } from '../api/platforms'

// Re-export types
export type { PlatformAccount, PlatformInfo, PlatformAccountCreate, PlatformAccountUpdate, PublishRequest, PublishRecord }

const QUERY_KEYS = {
  supportedPlatforms: ['supported-platforms'],
  accounts: ['platform-accounts'],
  publishHistory: ['publish-history'],
  publishStatus: (episodeId: string) => ['publish-status', episodeId],
}

export function useSupportedPlatforms() {
  return useQuery({
    queryKey: QUERY_KEYS.supportedPlatforms,
    queryFn: () => platformsApi.listSupportedPlatforms(),
    staleTime: 1000 * 60 * 60, // 1 hour - this data rarely changes
  })
}

export function usePlatformAccounts(platform?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.accounts, platform],
    queryFn: () => platformsApi.listAccounts(platform),
  })
}

export function useCreatePlatformAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlatformAccountCreate) => platformsApi.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts })
    },
  })
}

export function useUpdatePlatformAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlatformAccountUpdate }) =>
      platformsApi.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts })
    },
  })
}

export function useDeletePlatformAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => platformsApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts })
    },
  })
}

export function useRefreshPlatformToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => platformsApi.refreshToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts })
    },
  })
}

export function usePublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PublishRequest) => platformsApi.publish(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.publishHistory })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.publishStatus(variables.episode_id),
      })
    },
  })
}

export function usePublishHistory(options?: {
  episode_id?: string
  platform?: string
  status?: string
  limit?: number
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.publishHistory, options],
    queryFn: () => platformsApi.listPublishHistory(options),
  })
}

export function usePublishStatus(episodeId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.publishStatus(episodeId || ''),
    queryFn: () => platformsApi.getPublishStatus(episodeId!),
    enabled: !!episodeId,
  })
}

// Helper to get platform info by ID
export function getPlatformConfig(platformId: string): {
  name: string
  icon: string
  color: string
} {
  const configs: Record<string, { name: string; icon: string; color: string }> = {
    douyin: { name: '抖音 (Douyin)', icon: 'music_note', color: '#000000' },
    bilibili: { name: '哔哩哔哩 (Bilibili)', icon: 'smart_display', color: '#23ade5' },
    kuaishou: { name: '快手 (Kuaishou)', icon: 'video_camera_back', color: '#FF4C00' },
    wechat_channels: { name: '微信视频号', icon: 'chat_bubble', color: '#07C160' },
    youtube: { name: 'YouTube', icon: 'play_circle', color: '#FF0000' },
  }
  return configs[platformId] || { name: platformId, icon: 'link', color: '#666666' }
}
