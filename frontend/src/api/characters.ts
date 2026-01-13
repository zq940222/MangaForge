import { apiClient } from './client'

export interface Character {
  id: string
  project_id: string
  name: string
  description?: string
  gender?: string
  age_range?: string
  personality?: string
  reference_images?: string[]
  voice_sample_path?: string
  voice_id?: string
  created_at: string
  updated_at: string
}

export interface CharacterCreate {
  name: string
  description?: string
  gender?: string
  age_range?: string
  personality?: string
}

export interface CharacterUpdate {
  name?: string
  description?: string
  gender?: string
  age_range?: string
  personality?: string
  voice_id?: string
}

export const charactersApi = {
  list: async (projectId: string): Promise<Character[]> => {
    const response = await apiClient.get<Character[]>(`/projects/${projectId}/characters`)
    return response.data
  },

  get: async (projectId: string, characterId: string): Promise<Character> => {
    const response = await apiClient.get<Character>(`/projects/${projectId}/characters/${characterId}`)
    return response.data
  },

  create: async (projectId: string, data: CharacterCreate): Promise<Character> => {
    const response = await apiClient.post<Character>(`/projects/${projectId}/characters`, data)
    return response.data
  },

  update: async (projectId: string, characterId: string, data: CharacterUpdate): Promise<Character> => {
    const response = await apiClient.patch<Character>(`/projects/${projectId}/characters/${characterId}`, data)
    return response.data
  },

  delete: async (projectId: string, characterId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/characters/${characterId}`)
  },

  uploadReferenceImage: async (projectId: string, characterId: string, file: File): Promise<Character> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<Character>(
      `/projects/${projectId}/characters/${characterId}/reference-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  uploadVoiceSample: async (projectId: string, characterId: string, file: File): Promise<Character> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<Character>(
      `/projects/${projectId}/characters/${characterId}/voice-sample`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },
}
