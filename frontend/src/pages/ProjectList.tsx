import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useCreateProject } from '../hooks/useProjects'
import type { Project } from '../hooks/useProjects'

function getStatusDisplay(status: string) {
  const statusMap: Record<string, { label: string; bgColor: string; icon?: string }> = {
    draft: { label: 'DRAFT', bgColor: 'bg-gray-700/80' },
    generating: { label: 'GENERATING', bgColor: 'bg-primary/90', icon: 'sync' },
    completed: { label: 'DONE', bgColor: 'bg-black/60' },
    queued: { label: 'QUEUED', bgColor: 'bg-amber-500/80', icon: 'hourglass_empty' },
    failed: { label: 'FAILED', bgColor: 'bg-red-500/80', icon: 'error' },
  }
  return statusMap[status] || statusMap.draft
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `Edited ${diffMins}m ago`
  if (diffHours < 24) return `Edited ${diffHours}h ago`
  if (diffDays === 1) return 'Edited yesterday'
  return `Edited ${diffDays} days ago`
}

function ProjectCard({ project }: { project: Project }) {
  const statusInfo = getStatusDisplay(project.status)
  const isGenerating = project.status === 'generating'
  const isDraft = project.status === 'draft'

  if (isGenerating) {
    return (
      <Link to={`/projects/${project.id}`}>
        <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-primary/40 shadow-[0_0_15px_rgba(19,91,236,0.1)] transition-all cursor-pointer h-full">
          <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 border border-primary/20">
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f1115] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse"></div>
              <div className="loader mb-3"></div>
              <p className="text-primary text-xs font-medium animate-pulse">Rendering...</p>
            </div>
            <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
              {statusInfo.label}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 px-1">
            <h3 className="text-white text-sm font-bold truncate">{project.title}</h3>
            <p className="text-text-secondary text-xs">{project.episodes_count} episodes</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/projects/${project.id}`}>
      <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-border-dark hover:border-primary/50 transition-all cursor-pointer h-full">
        <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20 ${isDraft ? 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100' : ''}`}>
            <span className="material-symbols-outlined text-4xl text-white/30">movie</span>
          </div>

          <div className={`absolute top-2 right-2 ${statusInfo.bgColor} backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1`}>
            {statusInfo.icon && (
              <span className="material-symbols-outlined text-[10px]">{statusInfo.icon}</span>
            )}
            {project.status === 'completed' && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            )}
            {statusInfo.label}
          </div>

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

export function ProjectList() {
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)

  const { data, isLoading, error } = useProjects(page, 20, filterStatus)
  const createProjectMutation = useCreateProject()

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return
    try {
      await createProjectMutation.mutateAsync({ title: newProjectTitle })
      setNewProjectTitle('')
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  const projects = data?.items || []
  const totalPages = data?.total_pages || 1

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">My Projects</h1>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors text-white appearance-none cursor-pointer"
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || undefined)}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="generating">Generating</option>
              <option value="completed">Completed</option>
              <option value="queued">Queued</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p>Failed to load projects</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}

              {/* Create New Card */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-[#151a23] border-2 border-dashed border-border-dark hover:border-primary/50 hover:bg-surface-dark transition-all cursor-pointer h-full min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-full bg-surface-dark group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-text-secondary group-hover:text-primary text-3xl">add</span>
                </div>
                <span className="text-sm font-bold text-text-secondary group-hover:text-white">Create New Project</span>
              </button>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-text-secondary text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                <span className="material-symbols-outlined text-6xl mb-4">folder_open</span>
                <p className="text-lg font-medium mb-2">No projects yet</p>
                <p className="text-sm">Create your first project to get started</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-dark border border-border-dark rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
            <input
              type="text"
              placeholder="Project title..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || createProjectMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
