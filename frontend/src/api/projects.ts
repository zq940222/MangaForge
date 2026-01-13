import { apiClient } from './client'

export interface Project {
  id: string
  user_id: string
  title: string
  description?: string
  style: string
  target_platform: string
  aspect_ratio: string
  status: string
  settings?: Record<string, unknown>
  created_at: string
  updated_at: string
  episodes_count: number
  characters_count: number
}

export interface ProjectCreate {
  title: string
  description?: string
  style?: string
  target_platform?: string
  aspect_ratio?: string
  settings?: Record<string, unknown>
}

export interface ProjectUpdate {
  title?: string
  description?: string
  style?: string
  target_platform?: string
  aspect_ratio?: string
  status?: string
  settings?: Record<string, unknown>
}

export interface ProjectListResponse {
  items: Project[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export const projectsApi = {
  list: async (page = 1, pageSize = 20, status?: string): Promise<ProjectListResponse> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (status) params.append('status', status)
    const response = await apiClient.get<ProjectListResponse>(`/projects?${params}`)
    return response.data
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`)
    return response.data
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data)
    return response.data
  },

  update: async (id: string, data: ProjectUpdate): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
}
