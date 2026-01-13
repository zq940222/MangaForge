import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  Play,
  Users,
  Film,
  Settings,
  Trash2,
  Edit3,
} from 'lucide-react'
import { projectsApi } from '../api/projects'
import { episodesApi, EpisodeCreate } from '../api/episodes'
import { charactersApi, CharacterCreate } from '../api/characters'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Modal } from '../components/common/Modal'

type Tab = 'episodes' | 'characters' | 'settings'

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('episodes')
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false)
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false)
  const [newEpisode, setNewEpisode] = useState<EpisodeCreate>({
    episode_number: 1,
    title: '',
    script_input: '',
  })
  const [newCharacter, setNewCharacter] = useState<CharacterCreate>({
    name: '',
    description: '',
    gender: '',
    age_range: '',
    personality: '',
  })

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  })

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes', projectId],
    queryFn: () => episodesApi.list(projectId!),
    enabled: !!projectId,
  })

  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => charactersApi.list(projectId!),
    enabled: !!projectId,
  })

  const createEpisodeMutation = useMutation({
    mutationFn: (data: EpisodeCreate) => episodesApi.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes', projectId] })
      setIsEpisodeModalOpen(false)
      setNewEpisode({ episode_number: (episodes?.length ?? 0) + 1, title: '', script_input: '' })
    },
  })

  const createCharacterMutation = useMutation({
    mutationFn: (data: CharacterCreate) => charactersApi.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', projectId] })
      setIsCharacterModalOpen(false)
      setNewCharacter({ name: '', description: '', gender: '', age_range: '', personality: '' })
    },
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => episodesApi.delete(projectId!, episodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes', projectId] })
    },
  })

  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => charactersApi.delete(projectId!, characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', projectId] })
    },
  })

  if (projectLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">项目不存在</p>
        <Link to="/projects" className="text-primary-400 hover:text-primary-300 mt-2 inline-block">
          返回项目列表
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'episodes' as Tab, label: '集数', icon: Film, count: episodes?.length ?? 0 },
    { id: 'characters' as Tab, label: '角色', icon: Users, count: characters?.length ?? 0 },
    { id: 'settings' as Tab, label: '设置', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-gray-400">{project.description || '暂无描述'}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
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

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'episodes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setNewEpisode({
                  episode_number: (episodes?.length ?? 0) + 1,
                  title: '',
                  script_input: '',
                })
                setIsEpisodeModalOpen(true)
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加集数
            </button>
          </div>

          {episodesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : episodes?.length === 0 ? (
            <div className="card text-center py-8">
              <Film className="w-12 h-12 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">暂无集数，添加第一集开始创作</p>
            </div>
          ) : (
            <div className="space-y-3">
              {episodes?.map((episode) => (
                <div key={episode.id} className="card flex items-center justify-between group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">第 {episode.episode_number} 集</span>
                      <h3 className="font-medium">{episode.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          episode.status === 'completed'
                            ? 'bg-green-900/50 text-green-400'
                            : episode.status === 'processing'
                            ? 'bg-yellow-900/50 text-yellow-400'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {episode.status === 'pending' ? '待处理' :
                         episode.status === 'processing' ? '生成中' :
                         episode.status === 'completed' ? '已完成' : episode.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {episode.shots_count} 镜头 · {episode.script_input?.slice(0, 50) || '暂无剧本'}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${projectId}/generate/${episode.id}`}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      生成
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除这一集吗？')) {
                          deleteEpisodeMutation.mutate(episode.id)
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'characters' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsCharacterModalOpen(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加角色
            </button>
          </div>

          {charactersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : characters?.length === 0 ? (
            <div className="card text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-400">暂无角色，添加角色来定义您的故事</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters?.map((character) => (
                <div key={character.id} className="card group relative">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                      {character.reference_images?.[0] ? (
                        <img
                          src={character.reference_images[0]}
                          alt={character.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{character.name}</h3>
                      <p className="text-sm text-gray-400">
                        {character.gender} · {character.age_range}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {character.description || '暂无描述'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('确定要删除这个角色吗？')) {
                        deleteCharacterMutation.mutate(character.id)
                      }
                    }}
                    className="absolute top-4 right-4 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-medium mb-4">项目设置</h3>
          <div className="space-y-4">
            <div>
              <label className="label">风格</label>
              <div className="text-gray-300">{project.style}</div>
            </div>
            <div>
              <label className="label">目标平台</label>
              <div className="text-gray-300">{project.target_platform}</div>
            </div>
            <div>
              <label className="label">画面比例</label>
              <div className="text-gray-300">{project.aspect_ratio}</div>
            </div>
          </div>
        </div>
      )}

      {/* Episode Modal */}
      <Modal
        isOpen={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        title="添加集数"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">集数</label>
              <input
                type="number"
                className="input"
                min={1}
                value={newEpisode.episode_number}
                onChange={(e) => setNewEpisode({ ...newEpisode, episode_number: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="label">标题 *</label>
              <input
                type="text"
                className="input"
                placeholder="集标题"
                value={newEpisode.title}
                onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">剧本</label>
            <textarea
              className="input resize-none"
              rows={6}
              placeholder="输入剧本内容，AI 将自动解析并生成分镜..."
              value={newEpisode.script_input}
              onChange={(e) => setNewEpisode({ ...newEpisode, script_input: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsEpisodeModalOpen(false)} className="btn btn-secondary">
              取消
            </button>
            <button
              onClick={() => createEpisodeMutation.mutate(newEpisode)}
              disabled={!newEpisode.title.trim() || createEpisodeMutation.isPending}
              className="btn btn-primary disabled:opacity-50"
            >
              {createEpisodeMutation.isPending ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Character Modal */}
      <Modal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        title="添加角色"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">角色名 *</label>
            <input
              type="text"
              className="input"
              placeholder="角色名称"
              value={newCharacter.name}
              onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">性别</label>
              <select
                className="input"
                value={newCharacter.gender}
                onChange={(e) => setNewCharacter({ ...newCharacter, gender: e.target.value })}
              >
                <option value="">选择性别</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="label">年龄段</label>
              <select
                className="input"
                value={newCharacter.age_range}
                onChange={(e) => setNewCharacter({ ...newCharacter, age_range: e.target.value })}
              >
                <option value="">选择年龄段</option>
                <option value="child">儿童</option>
                <option value="teen">青少年</option>
                <option value="young_adult">青年</option>
                <option value="middle_aged">中年</option>
                <option value="elderly">老年</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">描述</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="角色外貌、穿着等描述..."
              value={newCharacter.description}
              onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label">性格</label>
            <input
              type="text"
              className="input"
              placeholder="如：开朗活泼、沉稳内敛..."
              value={newCharacter.personality}
              onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsCharacterModalOpen(false)} className="btn btn-secondary">
              取消
            </button>
            <button
              onClick={() => createCharacterMutation.mutate(newCharacter)}
              disabled={!newCharacter.name.trim() || createCharacterMutation.isPending}
              className="btn btn-primary disabled:opacity-50"
            >
              {createCharacterMutation.isPending ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
