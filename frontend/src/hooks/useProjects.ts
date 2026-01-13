import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  projectsApi,
  ProjectCreate,
  ProjectUpdate,
} from '../api/projects'
import type { Project, ProjectListResponse } from '../api/projects'

// Re-export types
export type { Project, ProjectListResponse, ProjectCreate, ProjectUpdate }

const QUERY_KEYS = {
  projects: ['projects'],
  project: (id: string) => ['project', id],
}

export function useProjects(page = 1, pageSize = 20, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.projects, page, pageSize, status],
    queryFn: () => projectsApi.list(page, pageSize, status),
  })
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id || ''),
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(variables.id) })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
  })
}
