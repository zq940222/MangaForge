import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  configApi,
  UserConfigCreate,
  UserConfigUpdate,
  TestConnectionRequest,
} from '../api/config'
import type { Provider, UserConfig } from '../api/config'

// Re-export types
export type { Provider, UserConfig, UserConfigCreate, UserConfigUpdate, TestConnectionRequest }

const QUERY_KEYS = {
  providers: ['providers'],
  userConfigs: ['user-configs'],
}

export function useProviders(serviceType?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.providers, serviceType],
    queryFn: () => configApi.listProviders(serviceType),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useUserConfigs(serviceType?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.userConfigs, serviceType],
    queryFn: () => configApi.listUserConfigs(serviceType),
  })
}

export function useCreateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserConfigCreate) => configApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userConfigs })
    },
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserConfigUpdate }) =>
      configApi.updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userConfigs })
    },
  })
}

export function useDeleteConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => configApi.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userConfigs })
    },
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (data: TestConnectionRequest) => configApi.testConnection(data),
  })
}

// Group configs by service type
export function groupConfigsByServiceType(configs: UserConfig[]): Record<string, UserConfig[]> {
  return configs.reduce((acc, config) => {
    if (!acc[config.service_type]) {
      acc[config.service_type] = []
    }
    acc[config.service_type].push(config)
    return acc
  }, {} as Record<string, UserConfig[]>)
}

// Get provider display info
export function getProviderDisplayInfo(provider: string): {
  name: string
  icon: string
  iconColor: string
} {
  const info: Record<string, { name: string; icon: string; iconColor: string }> = {
    openai: { name: 'OpenAI', icon: 'psychology', iconColor: 'text-green-400' },
    anthropic: { name: 'Anthropic', icon: 'smart_toy', iconColor: 'text-orange-400' },
    deepseek: { name: 'DeepSeek', icon: 'psychology_alt', iconColor: 'text-blue-400' },
    qwen: { name: '通义千问', icon: 'auto_awesome', iconColor: 'text-purple-400' },
    ollama: { name: 'Ollama', icon: 'terminal', iconColor: 'text-slate-400' },
    comfyui: { name: 'ComfyUI', icon: 'palette', iconColor: 'text-pink-400' },
    kling: { name: '可灵 Kling', icon: 'movie', iconColor: 'text-blue-400' },
    runway: { name: 'Runway', icon: 'theaters', iconColor: 'text-cyan-400' },
    vidu: { name: 'Vidu', icon: 'videocam', iconColor: 'text-indigo-400' },
    hunyuan: { name: 'Hunyuan', icon: 'video_library', iconColor: 'text-teal-400' },
    ltx: { name: 'LTX-2', icon: 'slow_motion_video', iconColor: 'text-amber-400' },
    'fish-speech': { name: 'Fish-Speech', icon: 'mic', iconColor: 'text-emerald-400' },
    xtts: { name: 'XTTS-v2', icon: 'record_voice_over', iconColor: 'text-rose-400' },
    'edge-tts': { name: 'Edge-TTS', icon: 'volume_up', iconColor: 'text-sky-400' },
    cosyvoice: { name: 'CosyVoice', icon: 'spatial_audio', iconColor: 'text-violet-400' },
    sadtalker: { name: 'SadTalker', icon: 'face', iconColor: 'text-fuchsia-400' },
    liveportrait: { name: 'LivePortrait', icon: 'portrait', iconColor: 'text-lime-400' },
    wav2lip: { name: 'Wav2Lip', icon: 'lips', iconColor: 'text-red-400' },
  }
  return info[provider] || { name: provider, icon: 'extension', iconColor: 'text-slate-400' }
}

// Service type display info
export function getServiceTypeInfo(serviceType: string): {
  name: string
  description: string
  icon: string
  iconBgColor: string
  iconTextColor: string
} {
  const info: Record<string, { name: string; description: string; icon: string; iconBgColor: string; iconTextColor: string }> = {
    llm: {
      name: 'LLM Services',
      description: 'Text generation & reasoning engines',
      icon: 'psychology',
      iconBgColor: 'bg-purple-500/10',
      iconTextColor: 'text-purple-400',
    },
    image: {
      name: 'Image Synthesis',
      description: 'Visual content generation',
      icon: 'palette',
      iconBgColor: 'bg-pink-500/10',
      iconTextColor: 'text-pink-400',
    },
    video: {
      name: 'Video Rendering',
      description: 'Motion & animation models',
      icon: 'movie',
      iconBgColor: 'bg-blue-500/10',
      iconTextColor: 'text-blue-400',
    },
    voice: {
      name: 'Voice Synthesis',
      description: 'Text-to-speech & voice cloning',
      icon: 'mic',
      iconBgColor: 'bg-emerald-500/10',
      iconTextColor: 'text-emerald-400',
    },
    lipsync: {
      name: 'Lip Sync',
      description: 'Audio-visual synchronization',
      icon: 'face',
      iconBgColor: 'bg-amber-500/10',
      iconTextColor: 'text-amber-400',
    },
  }
  return info[serviceType] || {
    name: serviceType,
    description: 'Service configuration',
    icon: 'settings',
    iconBgColor: 'bg-slate-500/10',
    iconTextColor: 'text-slate-400',
  }
}
