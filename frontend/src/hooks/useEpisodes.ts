import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  episodesApi,
  Episode,
  Shot,
  EpisodeCreate,
  EpisodeUpdate,
} from '../api/episodes'

const QUERY_KEYS = {
  episodes: (projectId: string) => ['episodes', projectId],
  episode: (projectId: string, episodeId: string) => ['episode', projectId, episodeId],
}

export function useEpisodes(projectId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.episodes(projectId || ''),
    queryFn: () => episodesApi.list(projectId!),
    enabled: !!projectId,
  })
}

export function useEpisode(projectId?: string, episodeId?: string, includeShots = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.episode(projectId || '', episodeId || ''), includeShots],
    queryFn: () => episodesApi.get(projectId!, episodeId!, includeShots),
    enabled: !!projectId && !!episodeId,
  })
}

export function useCreateEpisode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: EpisodeCreate }) =>
      episodesApi.create(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.episodes(variables.projectId) })
    },
  })
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      episodeId,
      data,
    }: {
      projectId: string
      episodeId: string
      data: EpisodeUpdate
    }) => episodesApi.update(projectId, episodeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.episodes(variables.projectId) })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.episode(variables.projectId, variables.episodeId),
      })
    },
  })
}

export function useDeleteEpisode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, episodeId }: { projectId: string; episodeId: string }) =>
      episodesApi.delete(projectId, episodeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.episodes(variables.projectId) })
    },
  })
}

// Re-export types for convenience
export type { Episode, Shot, EpisodeCreate, EpisodeUpdate }
