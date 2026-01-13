import { apiClient } from './client'

export interface GenerationRequest {
  episode_id: string
  script_input?: string
  style?: string
  add_subtitles?: boolean
  bgm_path?: string
  bgm_volume?: number
  regenerate_from?: string
}

export interface GenerationResponse {
  task_id: string
  episode_id: string
  status: string
  message: string
}

export interface GenerationStatus {
  task_id: string
  episode_id: string
  status: string
  progress: number
  current_stage?: string
  message: string
  result?: Record<string, unknown>
  error?: string
  started_at?: string
  completed_at?: string
}

export interface GenerationResult {
  success: boolean
  episode_id: string
  video_path?: string
  video_url?: string
  duration?: number
  stages: Record<string, unknown>
}

export const generationApi = {
  start: async (data: GenerationRequest): Promise<GenerationResponse> => {
    const response = await apiClient.post<GenerationResponse>('/generate', data)
    return response.data
  },

  getStatus: async (taskId: string): Promise<GenerationStatus> => {
    const response = await apiClient.get<GenerationStatus>(`/generate/${taskId}/status`)
    return response.data
  },

  getResult: async (taskId: string): Promise<GenerationResult> => {
    const response = await apiClient.get<GenerationResult>(`/generate/${taskId}/result`)
    return response.data
  },

  cancel: async (taskId: string): Promise<GenerationResponse> => {
    const response = await apiClient.post<GenerationResponse>(`/generate/${taskId}/cancel`)
    return response.data
  },
}
