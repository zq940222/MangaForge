import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../hooks/useProjects'

function useFormatTimeAgo() {
  const { t } = useTranslation()

  return (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('dashboard.time.justNow')
    if (diffMins < 60) return t('dashboard.time.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('dashboard.time.hoursAgo', { count: diffHours })
    if (diffDays === 1) return t('dashboard.time.yesterday')
    return t('dashboard.time.daysAgo', { count: diffDays })
  }
}

function RecentProjectCard({ project }: { project: Project }) {
  const { t } = useTranslation()
  const formatTimeAgo = useFormatTimeAgo()
  const isGenerating = project.status === 'generating'
  const isDraft = project.status === 'draft'
  const isCompleted = project.status === 'completed'
  const isQueued = project.status === 'queued'

  if (isGenerating) {
    return (
      <Link to={`/projects/${project.id}`}>
        <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-primary/40 shadow-[0_0_15px_rgba(19,91,236,0.1)] transition-all cursor-pointer">
          <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 border border-primary/20">
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f1115] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse"></div>
              <div className="loader mb-3"></div>
              <p className="text-primary text-xs font-medium animate-pulse">{t('dashboard.status.rendering')}</p>
            </div>
            <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
              {t('dashboard.status.generating')}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 px-1">
            <h3 className="text-white text-sm font-bold truncate">{project.title}</h3>
            <p className="text-text-secondary text-xs">{project.episodes_count} {t('common.episodes')}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/projects/${project.id}`}>
      <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-border-dark hover:border-primary/50 transition-all cursor-pointer">
        <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20 ${isDraft ? 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100' : ''}`}>
            <span className="material-symbols-outlined text-4xl text-white/30">movie</span>
          </div>

          {isCompleted && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {t('dashboard.status.done')}
            </div>
          )}
          {isDraft && (
            <div className="absolute top-2 right-2 bg-gray-700/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
              {t('dashboard.status.draft')}
            </div>
          )}
          {isQueued && (
            <div className="absolute top-2 right-2 bg-amber-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">hourglass_empty</span>
              {t('dashboard.status.queued')}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 bg-white text-black rounded-full hover:bg-gray-200">
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 px-1">
          <h3 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">{project.title}</h3>
          <p className="text-text-secondary text-xs">{formatTimeAgo(project.updated_at)}</p>
        </div>
      </div>
    </Link>
  )
}

export function Dashboard() {
  const { t } = useTranslation()
  const { data: projectsData, isLoading } = useProjects(1, 4)
  const projects = projectsData?.items || []
  const totalProjects = projectsData?.total || 0

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">{t('dashboard.welcome')}</h1>
          <p className="text-text-secondary">{t('dashboard.welcomeDesc')}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-surface-dark hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium">{t('dashboard.stats.totalProjects')}</p>
              <span className="material-symbols-outlined text-primary/70">folder</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-white text-3xl font-bold tracking-tight">{totalProjects}</p>
            </div>
            <p className="text-text-secondary text-xs mt-1">{t('dashboard.projectsInWorkspace')}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-surface-dark hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium">{t('dashboard.stats.activeGenerations')}</p>
              <span className="material-symbols-outlined text-primary/70">bolt</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-white text-3xl font-bold tracking-tight">
                {projects.filter(p => p.status === 'generating' || p.status === 'queued').length}
              </p>
            </div>
            <p className="text-text-secondary text-xs mt-1">{t('dashboard.currentlyProcessing')}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-surface-dark hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium">{t('dashboard.stats.completed')}</p>
              <span className="material-symbols-outlined text-primary/70">check_circle</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-white text-3xl font-bold tracking-tight">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <p className="text-text-secondary text-xs mt-1">{t('dashboard.readyToPublish')}</p>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Recent Projects */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{t('dashboard.recentProjects')}</h2>
              <Link to="/projects" className="text-sm text-primary font-medium hover:text-white transition-colors">{t('common.viewAll')}</Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary bg-surface-dark rounded-xl border border-border-dark">
                <span className="material-symbols-outlined text-5xl mb-3">folder_open</span>
                <p className="text-sm mb-3">{t('dashboard.noProjects')}</p>
                <Link
                  to="/projects"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-bold text-white transition-colors"
                >
                  {t('dashboard.createFirstProject')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {projects.map((project) => (
                  <RecentProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{t('dashboard.systemStatus')}</h2>
              <div className="flex items-center gap-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-emerald-500 font-medium ml-1">{t('common.online')}</span>
              </div>
            </div>
            <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden flex flex-col">
              {/* Agent 1 */}
              <div className="p-4 border-b border-border-dark hover:bg-[#232730] transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t('dashboard.agents.scriptWriter')}</p>
                      <p className="text-xs text-text-secondary">{t('dashboard.agents.llmAgent')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-[#282e39] text-xs text-white font-medium">{t('common.idle')}</span>
                </div>
              </div>

              {/* Agent 2 */}
              <div className="p-4 border-b border-border-dark hover:bg-[#232730] transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">face</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t('dashboard.agents.charGen')}</p>
                      <p className="text-xs text-text-secondary">{t('dashboard.agents.imageGeneration')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-[#282e39] text-xs text-white font-medium">{t('common.idle')}</span>
                </div>
              </div>

              {/* Agent 3 */}
              <div className="p-4 hover:bg-[#232730] transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <span className="material-symbols-outlined text-lg">movie</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t('dashboard.agents.videoRenderer')}</p>
                      <p className="text-xs text-text-secondary">{t('dashboard.agents.videoGeneration')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-[#282e39] text-xs text-white font-medium">{t('common.idle')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#1c1f27] to-[#161820] rounded-xl border border-border-dark p-4 mt-2">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">tips_and_updates</span>
                <div>
                  <p className="text-sm font-bold text-white">{t('dashboard.quickStart')}</p>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{t('dashboard.quickStartDesc')}</p>
                  <Link to="/projects" className="text-xs text-primary font-bold mt-2 hover:underline inline-block">
                    {t('common.getStarted')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
