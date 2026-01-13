import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { projectsApi } from '../api/projects'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects', 1, 5],
    queryFn: () => projectsApi.list(1, 5),
  })

  const stats = [
    { label: '总项目', value: data?.total ?? 0, icon: FolderOpen, color: 'text-blue-400' },
    { label: '进行中', value: data?.items.filter((p) => p.status === 'processing').length ?? 0, icon: Clock, color: 'text-yellow-400' },
    { label: '已完成', value: data?.items.filter((p) => p.status === 'completed').length ?? 0, icon: CheckCircle, color: 'text-green-400' },
    { label: '失败', value: data?.items.filter((p) => p.status === 'failed').length ?? 0, icon: AlertCircle, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <Link to="/projects" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建项目
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gray-700 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">最近项目</h2>
          <Link to="/projects" className="text-primary-400 hover:text-primary-300 text-sm">
            查看全部
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无项目</p>
            <Link to="/projects" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
              创建第一个项目
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div>
                  <div className="font-medium">{project.title}</div>
                  <div className="text-sm text-gray-400">
                    {project.episodes_count} 集 · {project.characters_count} 角色
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      project.status === 'completed'
                        ? 'bg-green-900/50 text-green-400'
                        : project.status === 'processing'
                        ? 'bg-yellow-900/50 text-yellow-400'
                        : project.status === 'failed'
                        ? 'bg-red-900/50 text-red-400'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {project.status === 'draft' ? '草稿' :
                     project.status === 'processing' ? '处理中' :
                     project.status === 'completed' ? '已完成' :
                     project.status === 'failed' ? '失败' : project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
