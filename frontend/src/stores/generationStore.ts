import { create } from 'zustand'

export type GenerationStage =
  | 'script'
  | 'character'
  | 'storyboard'
  | 'render'
  | 'video'
  | 'voice'
  | 'lipsync'
  | 'edit'
  | 'complete'
  | 'failed'

interface StageInfo {
  name: string
  progress: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  message?: string
}

interface GenerationState {
  // Current task
  taskId: string | null
  episodeId: string | null
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

  // Progress
  currentStage: GenerationStage | null
  overallProgress: number
  stages: Record<GenerationStage, StageInfo>

  // Result
  videoUrl: string | null
  error: string | null

  // Actions
  setTaskId: (taskId: string) => void
  setEpisodeId: (episodeId: string) => void
  setStatus: (status: GenerationState['status']) => void
  updateProgress: (stage: GenerationStage, progress: number, message?: string) => void
  completeStage: (stage: GenerationStage) => void
  failStage: (stage: GenerationStage, error: string) => void
  setVideoUrl: (url: string) => void
  setError: (error: string) => void
  reset: () => void
}

const initialStages: Record<GenerationStage, StageInfo> = {
  script: { name: '剧本解析', progress: 0, status: 'pending' },
  character: { name: '角色生成', progress: 0, status: 'pending' },
  storyboard: { name: '分镜规划', progress: 0, status: 'pending' },
  render: { name: '图像渲染', progress: 0, status: 'pending' },
  video: { name: '视频生成', progress: 0, status: 'pending' },
  voice: { name: '配音合成', progress: 0, status: 'pending' },
  lipsync: { name: '口型同步', progress: 0, status: 'pending' },
  edit: { name: '最终剪辑', progress: 0, status: 'pending' },
  complete: { name: '完成', progress: 0, status: 'pending' },
  failed: { name: '失败', progress: 0, status: 'pending' },
}

const stageWeights: Record<GenerationStage, number> = {
  script: 5,
  character: 10,
  storyboard: 5,
  render: 25,
  video: 25,
  voice: 10,
  lipsync: 15,
  edit: 5,
  complete: 0,
  failed: 0,
}

function calculateOverallProgress(stages: Record<GenerationStage, StageInfo>): number {
  let totalWeight = 0
  let completedWeight = 0

  for (const [stage, info] of Object.entries(stages)) {
    const weight = stageWeights[stage as GenerationStage]
    if (weight > 0) {
      totalWeight += weight
      if (info.status === 'completed') {
        completedWeight += weight
      } else if (info.status === 'in_progress') {
        completedWeight += weight * (info.progress / 100)
      }
    }
  }

  return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0
}

export const useGenerationStore = create<GenerationState>((set) => ({
  taskId: null,
  episodeId: null,
  status: 'idle',
  currentStage: null,
  overallProgress: 0,
  stages: { ...initialStages },
  videoUrl: null,
  error: null,

  setTaskId: (taskId) => set({ taskId }),
  setEpisodeId: (episodeId) => set({ episodeId }),
  setStatus: (status) => set({ status }),

  updateProgress: (stage, progress, message) => set((state) => {
    const newStages = {
      ...state.stages,
      [stage]: {
        ...state.stages[stage],
        progress,
        status: 'in_progress' as const,
        message,
      },
    }
    return {
      stages: newStages,
      currentStage: stage,
      overallProgress: calculateOverallProgress(newStages),
    }
  }),

  completeStage: (stage) => set((state) => {
    const newStages = {
      ...state.stages,
      [stage]: {
        ...state.stages[stage],
        progress: 100,
        status: 'completed' as const,
      },
    }
    return {
      stages: newStages,
      overallProgress: calculateOverallProgress(newStages),
    }
  }),

  failStage: (stage, error) => set((state) => ({
    stages: {
      ...state.stages,
      [stage]: {
        ...state.stages[stage],
        status: 'failed' as const,
        message: error,
      },
    },
    status: 'failed',
    error,
  })),

  setVideoUrl: (url) => set({ videoUrl: url, status: 'completed' }),
  setError: (error) => set({ error, status: 'failed' }),

  reset: () => set({
    taskId: null,
    episodeId: null,
    status: 'idle',
    currentStage: null,
    overallProgress: 0,
    stages: { ...initialStages },
    videoUrl: null,
    error: null,
  }),
}))
