import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  charactersApi,
  Character,
  CharacterCreate,
  CharacterUpdate,
} from '../api/characters'

// Re-export types
export type { Character, CharacterCreate, CharacterUpdate }

const QUERY_KEYS = {
  characters: (projectId: string) => ['characters', projectId],
  character: (projectId: string, characterId: string) => ['character', projectId, characterId],
}

export function useCharacters(projectId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.characters(projectId || ''),
    queryFn: () => charactersApi.list(projectId!),
    enabled: !!projectId,
  })
}

export function useCharacter(projectId?: string, characterId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.character(projectId || '', characterId || ''),
    queryFn: () => charactersApi.get(projectId!, characterId!),
    enabled: !!projectId && !!characterId,
  })
}

export function useCreateCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CharacterCreate }) =>
      charactersApi.create(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(variables.projectId) })
    },
  })
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      characterId,
      data,
    }: {
      projectId: string
      characterId: string
      data: CharacterUpdate
    }) => charactersApi.update(projectId, characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(variables.projectId) })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.character(variables.projectId, variables.characterId),
      })
    },
  })
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, characterId }: { projectId: string; characterId: string }) =>
      charactersApi.delete(projectId, characterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(variables.projectId) })
    },
  })
}

export function useUploadReferenceImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      characterId,
      file,
    }: {
      projectId: string
      characterId: string
      file: File
    }) => charactersApi.uploadReferenceImage(projectId, characterId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(variables.projectId) })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.character(variables.projectId, variables.characterId),
      })
    },
  })
}

export function useUploadVoiceSample() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      characterId,
      file,
    }: {
      projectId: string
      characterId: string
      file: File
    }) => charactersApi.uploadVoiceSample(projectId, characterId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(variables.projectId) })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.character(variables.projectId, variables.characterId),
      })
    },
  })
}
