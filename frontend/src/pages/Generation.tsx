import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Play, Square, Download, RefreshCw, Check, Loader2, AlertCircle } from 'lucide-react'
import { episodesApi } from '../api/episodes'
import { projectsApi } from '../api/projects'
import { useGeneration } from '../hooks/useGeneration'
import { ProgressBar } from '../components/common/ProgressBar'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function Generation() {
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId: string }>()
  const generation = useGeneration()

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  })

  const { data: episode, isLoading: episodeLoading } = useQuery({
    queryKey: ['episode', projectId, episodeId],
    queryFn: () => episodesApi.get(projectId!, episodeId!, true),
    enabled: !!projectId && !!episodeId,
  })

  const handleStart = () => {
    if (!episodeId) return
    generation.startGeneration({
      episode_id: episodeId,
      style: project?.style,
      add_subtitles: true,
    })
  }

  if (episodeLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">集数不存在</p>
        <Link to={`/projects/${projectId}`} className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
          返回项目
        </Link>
      </div>
    )
  }

  const stageLabels: Record<string, string> = {
    script: '剧本解析',
    character: '角色生成',
    storyboard: '分镜规划',
    render: '图像渲染',
    video: '视频生成',
    voice: '配音合成',
    lipsync: '口型同步',
    edit: '最终剪辑',
  }

  const stageOrder = ['script', 'character', 'storyboard', 'render', 'video', 'voice', 'lipsync', 'edit']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/projects/${projectId}`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.title}</h1>
          <p className="text-gray-400">第 {episode.episode_number} 集: {episode.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Script & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Script Preview */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">剧本内容</h3>
            <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {episode.script_input || '暂无剧本内容'}
              </pre>
            </div>
          </div>

          {/* Progress */}
          {generation.status !== 'idle' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">生成进度</h3>
                <span className="text-sm text-gray-400">
                  {Math.round(generation.overallProgress)}%
                </span>
              </div>

              <ProgressBar progress={generation.overallProgress} size="lg" className="mb-6" />

              {/* Stage List */}
              <div className="space-y-3">
                {stageOrder.map((stageKey) => {
                  const stage = generation.stages[stageKey as keyof typeof generation.stages]
                  if (!stage) return null

                  const isActive = generation.currentStage === stageKey
                  const isCompleted = stage.status === 'completed'
                  const isFailed = stage.status === 'failed'

                  return (
                    <div
                      key={stageKey}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        isActive ? 'bg-primary-900/30 border border-primary-700' :
                        isCompleted ? 'bg-green-900/20' :
                        isFailed ? 'bg-red-900/20' :
                        'bg-gray-800/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-600' :
                        isFailed ? 'bg-red-600' :
                        isActive ? 'bg-primary-600' :
                        'bg-gray-700'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : isFailed ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-xs">{stageOrder.indexOf(stageKey) + 1}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={isActive || isCompleted ? 'text-white' : 'text-gray-400'}>
                            {stageLabels[stageKey]}
                          </span>
                          {isActive && (
                            <span className="text-sm text-primary-400">
                              {Math.round(stage.progress)}%
                            </span>
                          )}
                        </div>
                        {isActive && stage.message && (
                          <p className="text-sm text-gray-400 mt-1">{stage.message}</p>
                        )}
                        {isFailed && stage.message && (
                          <p className="text-sm text-red-400 mt-1">{stage.message}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Error */}
              {generation.error && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400">{generation.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Result Video */}
          {generation.status === 'completed' && generation.videoUrl && (
            <div className="card">
              <h3 className="text-lg font-medium mb-4">生成结果</h3>
              <div className="aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                <video
                  src={generation.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex justify-center mt-4">
                <a
                  href={generation.videoUrl}
                  download
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载视频
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium mb-4">生成控制</h3>

            {generation.status === 'idle' ? (
              <button
                onClick={handleStart}
                disabled={generation.isStarting || !episode.script_input}
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {generation.isStarting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                开始生成
              </button>
            ) : generation.status === 'running' ? (
              <button
                onClick={generation.cancelGeneration}
                disabled={generation.isCancelling}
                className="btn btn-danger w-full flex items-center justify-center gap-2 py-3"
              >
                {generation.isCancelling ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                取消生成
              </button>
            ) : (
              <button
                onClick={() => {
                  generation.reset()
                  handleStart()
                }}
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <RefreshCw className="w-5 h-5" />
                重新生成
              </button>
            )}

            {!episode.script_input && (
              <p className="text-sm text-yellow-400 mt-2">
                请先添加剧本内容
              </p>
            )}
          </div>

          {/* Info */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">生成信息</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">风格</dt>
                <dd>{project?.style || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">比例</dt>
                <dd>{project?.aspect_ratio || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">平台</dt>
                <dd>{project?.target_platform || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">状态</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    generation.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                    generation.status === 'running' ? 'bg-yellow-900/50 text-yellow-400' :
                    generation.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {generation.status === 'idle' ? '待开始' :
                     generation.status === 'running' ? '生成中' :
                     generation.status === 'completed' ? '已完成' :
                     generation.status === 'failed' ? '失败' :
                     generation.status === 'cancelled' ? '已取消' : generation.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
