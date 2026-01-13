import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Trash2, MoreVertical, FolderOpen } from 'lucide-react'
import { projectsApi, ProjectCreate } from '../api/projects'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Modal } from '../components/common/Modal'

export function ProjectList() {
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProject, setNewProject] = useState<ProjectCreate>({
    title: '',
    description: '',
    style: 'anime',
    target_platform: 'douyin',
    aspect_ratio: '9:16',
  })

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, 20],
    queryFn: () => projectsApi.list(page, 20),
  })

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsCreateModalOpen(false)
      setNewProject({
        title: '',
        description: '',
        style: 'anime',
        target_platform: 'douyin',
        aspect_ratio: '9:16',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const handleCreate = () => {
    if (newProject.title.trim()) {
      createMutation.mutate(newProject)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">项目列表</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium mb-2">暂无项目</h3>
          <p className="text-gray-400 mb-4">创建您的第一个 AI 漫剧项目</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            创建项目
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((project) => (
              <div key={project.id} className="card group relative">
                <Link to={`/projects/${project.id}`} className="block">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold truncate pr-8">{project.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs shrink-0 ${
                        project.status === 'completed'
                          ? 'bg-green-900/50 text-green-400'
                          : project.status === 'processing'
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {project.status === 'draft' ? '草稿' :
                       project.status === 'processing' ? '处理中' :
                       project.status === 'completed' ? '已完成' : project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {project.description || '暂无描述'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{project.episodes_count} 集</span>
                    <span>{project.characters_count} 角色</span>
                    <span>{project.style}</span>
                  </div>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (confirm('确定要删除这个项目吗？')) {
                      deleteMutation.mutate(project.id)
                    }
                  }}
                  className="absolute top-4 right-4 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-gray-400">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="新建项目"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">项目名称 *</label>
            <input
              type="text"
              className="input"
              placeholder="输入项目名称"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            />
          </div>

          <div>
            <label className="label">描述</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="项目描述（可选）"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">风格</label>
              <select
                className="input"
                value={newProject.style}
                onChange={(e) => setNewProject({ ...newProject, style: e.target.value })}
              >
                <option value="anime">动漫风</option>
                <option value="realistic">写实风</option>
                <option value="cartoon">卡通风</option>
                <option value="watercolor">水彩风</option>
              </select>
            </div>

            <div>
              <label className="label">目标平台</label>
              <select
                className="input"
                value={newProject.target_platform}
                onChange={(e) => setNewProject({ ...newProject, target_platform: e.target.value })}
              >
                <option value="douyin">抖音</option>
                <option value="kuaishou">快手</option>
                <option value="bilibili">B站</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">画面比例</label>
            <select
              className="input"
              value={newProject.aspect_ratio}
              onChange={(e) => setNewProject({ ...newProject, aspect_ratio: e.target.value })}
            >
              <option value="9:16">9:16 (竖屏)</option>
              <option value="16:9">16:9 (横屏)</option>
              <option value="1:1">1:1 (方形)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!newProject.title.trim() || createMutation.isPending}
              className="btn btn-primary disabled:opacity-50"
            >
              {createMutation.isPending ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
