import { apiClient } from './client'

export interface Shot {
  id: string
  episode_id: string
  shot_number: number
  scene_description?: string
  camera_type?: string
  camera_movement?: string
  dialog?: {
    speaker?: string
    text?: string
    emotion?: string
  }
  duration: number
  image_prompt?: string
  negative_prompt?: string
  video_prompt?: string
  image_path?: string
  video_path?: string
  audio_path?: string
  lipsync_video_path?: string
  final_video_path?: string
  status: 'pending' | 'rendering' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at?: string
}

export interface Episode {
  id: string
  project_id: string
  episode_number: number
  title: string
  script_input?: string
  script_parsed?: Record<string, unknown>
  storyboard?: Record<string, unknown>
  video_path?: string
  duration?: number
  status: string
  created_at: string
  updated_at: string
  shots_count: number
  shots: Shot[]
}

export interface EpisodeCreate {
  episode_number: number
  title: string
  script_input?: string
}

export interface EpisodeUpdate {
  episode_number?: number
  title?: string
  script_input?: string
  status?: string
}

export const episodesApi = {
  list: async (projectId: string): Promise<Episode[]> => {
    const response = await apiClient.get<Episode[]>(`/projects/${projectId}/episodes`)
    return response.data
  },

  get: async (projectId: string, episodeId: string, includeShots = false): Promise<Episode> => {
    const params = includeShots ? '?include_shots=true' : ''
    const response = await apiClient.get<Episode>(`/projects/${projectId}/episodes/${episodeId}${params}`)
    return response.data
  },

  create: async (projectId: string, data: EpisodeCreate): Promise<Episode> => {
    const response = await apiClient.post<Episode>(`/projects/${projectId}/episodes`, data)
    return response.data
  },

  update: async (projectId: string, episodeId: string, data: EpisodeUpdate): Promise<Episode> => {
    const response = await apiClient.patch<Episode>(`/projects/${projectId}/episodes/${episodeId}`, data)
    return response.data
  },

  delete: async (projectId: string, episodeId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/episodes/${episodeId}`)
  },
}
