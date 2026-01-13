import { useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { generationApi, GenerationRequest } from '../api/generation'
import { useGenerationStore, GenerationStage } from '../stores/generationStore'
import { useWebSocket } from './useWebSocket'

export function useGeneration(taskId?: string) {
  const store = useGenerationStore()

  // WebSocket for real-time updates
  useWebSocket({
    taskId,
    onMessage: (message) => {
      if (message.type === 'progress') {
        const stage = message.data.stage as GenerationStage
        const progress = message.data.stage_progress ?? message.data.progress ?? 0
        store.updateProgress(stage, progress, message.data.message)
      } else if (message.type === 'stage_complete') {
        const stage = message.data.stage as GenerationStage
        store.completeStage(stage)
      } else if (message.type === 'complete') {
        store.setStatus('completed')
        if (message.data.video_url) {
          store.setVideoUrl(message.data.video_url)
        }
      } else if (message.type === 'error') {
        store.setError(message.data.error || 'Unknown error')
      }
    },
    onConnect: () => {
      console.log('Connected to generation WebSocket')
    },
    onDisconnect: () => {
      console.log('Disconnected from generation WebSocket')
    },
  })

  // Start generation mutation
  const startMutation = useMutation({
    mutationFn: (request: GenerationRequest) => generationApi.start(request),
    onSuccess: (response) => {
      store.setTaskId(response.task_id)
      store.setEpisodeId(response.episode_id)
      store.setStatus('running')
    },
    onError: (error: Error) => {
      store.setError(error.message)
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => generationApi.cancel(taskId),
    onSuccess: () => {
      store.setStatus('cancelled')
    },
  })

  // Status polling (fallback if WebSocket fails)
  const statusQuery = useQuery({
    queryKey: ['generation-status', taskId],
    queryFn: () => generationApi.getStatus(taskId!),
    enabled: !!taskId && store.status === 'running',
    refetchInterval: 5000,
  })

  // Result query
  const resultQuery = useQuery({
    queryKey: ['generation-result', taskId],
    queryFn: () => generationApi.getResult(taskId!),
    enabled: !!taskId && store.status === 'completed',
  })

  const startGeneration = useCallback(
    (request: GenerationRequest) => {
      store.reset()
      startMutation.mutate(request)
    },
    [startMutation, store]
  )

  const cancelGeneration = useCallback(() => {
    if (store.taskId) {
      cancelMutation.mutate(store.taskId)
    }
  }, [cancelMutation, store.taskId])

  return {
    // State
    taskId: store.taskId,
    status: store.status,
    currentStage: store.currentStage,
    overallProgress: store.overallProgress,
    stages: store.stages,
    videoUrl: store.videoUrl,
    error: store.error,

    // Actions
    startGeneration,
    cancelGeneration,
    reset: store.reset,

    // Query states
    isStarting: startMutation.isPending,
    isCancelling: cancelMutation.isPending,
    result: resultQuery.data,
  }
}
