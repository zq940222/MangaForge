import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { episodesApi, EpisodeCreate } from '../api/episodes'
import { charactersApi, CharacterCreate } from '../api/characters'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Modal } from '../components/common/Modal'

type Tab = 'episodes' | 'characters' | 'settings'

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
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
      queryClient.invalidateQueries({ queryKey: ['episodes', projectId], refetchType: 'active' })
      setIsEpisodeModalOpen(false)
      setNewEpisode({ episode_number: (episodes?.length ?? 0) + 1, title: '', script_input: '' })
    },
  })

  const createCharacterMutation = useMutation({
    mutationFn: (data: CharacterCreate) => charactersApi.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', projectId], refetchType: 'active' })
      setIsCharacterModalOpen(false)
      setNewCharacter({ name: '', description: '', gender: '', age_range: '', personality: '' })
    },
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => episodesApi.delete(projectId!, episodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes', projectId], refetchType: 'active' })
    },
  })

  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => charactersApi.delete(projectId!, characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', projectId], refetchType: 'active' })
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
        <p className="text-text-secondary">项目不存在</p>
        <Link to="/projects" className="text-primary hover:text-blue-400 mt-2 inline-block">
          返回项目列表
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'episodes' as Tab, label: '集数', icon: 'movie', count: episodes?.length ?? 0 },
    { id: 'characters' as Tab, label: '角色', icon: 'group', count: characters?.length ?? 0 },
    { id: 'settings' as Tab, label: '设置', icon: 'settings' },
  ]

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-surface-dark rounded-lg transition-colors text-text-secondary hover:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{project.title}</h1>
          <p className="text-text-secondary">{project.description || '暂无描述'}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-bold border ${
            project.status === 'completed'
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : project.status === 'processing'
              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              : 'bg-surface-dark text-text-secondary border-border-dark'
          }`}
        >
          {project.status === 'draft' ? '草稿' :
           project.status === 'processing' ? '处理中' :
           project.status === 'completed' ? '已完成' : project.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-dark">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2 py-3 border-b-2 transition-colors font-medium ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 bg-surface-dark border border-border-dark rounded text-xs">{tab.count}</span>
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
              <span className="material-symbols-outlined text-[20px]">add</span>
              添加集数
            </button>
          </div>

          {episodesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : episodes?.length === 0 ? (
            <div className="card text-center py-12 border-dashed border-2">
              <span className="material-symbols-outlined text-6xl text-text-secondary mb-2">movie</span>
              <p className="text-text-secondary">暂无集数，添加第一集开始创作</p>
            </div>
          ) : (
            <div className="space-y-3">
              {episodes?.map((episode) => (
                <div key={episode.id} className="card flex items-center justify-between group hover:border-primary/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-text-secondary font-mono">#{episode.episode_number}</span>
                      <h3 className="font-bold text-white">{episode.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          episode.status === 'completed'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : episode.status === 'processing'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-surface-dark text-text-secondary border-border-dark'
                        }`}
                      >
                        {episode.status === 'pending' ? '待处理' :
                         episode.status === 'processing' ? '生成中' :
                         episode.status === 'completed' ? '已完成' : episode.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                      {episode.shots_count} 镜头 · {episode.script_input?.slice(0, 50) || '暂无剧本'}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${projectId}/generate/${episode.id}`}
                      className="btn btn-primary flex items-center gap-2 text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      Editor
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除这一集吗？')) {
                          deleteEpisodeMutation.mutate(episode.id)
                        }
                      }}
                      className="p-2 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined">delete</span>
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
              <span className="material-symbols-outlined text-[20px]">add</span>
              添加角色
            </button>
          </div>

          {charactersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : characters?.length === 0 ? (
            <div className="card text-center py-12 border-dashed border-2">
              <span className="material-symbols-outlined text-6xl text-text-secondary mb-2">group</span>
              <p className="text-text-secondary">暂无角色，添加角色来定义您的故事</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters?.map((character) => (
                <div key={character.id} className="card group relative hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-background-dark rounded-lg flex items-center justify-center text-2xl overflow-hidden border border-border-dark">
                      {character.reference_images?.[0] ? (
                        <img
                          src={character.reference_images[0]}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-text-secondary">person</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{character.name}</h3>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {character.gender === 'male' ? '男性' : character.gender === 'female' ? '女性' : character.gender} · {character.age_range}
                      </p>
                      <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
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
                    className="absolute top-4 right-4 p-1 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-bold text-white mb-4">项目设置</h3>
          <div className="space-y-4">
            <div>
              <label className="label">风格</label>
              <div className="text-gray-300 font-mono bg-background-dark px-3 py-2 rounded border border-border-dark">{project.style}</div>
            </div>
            <div>
              <label className="label">目标平台</label>
              <div className="text-gray-300 font-mono bg-background-dark px-3 py-2 rounded border border-border-dark">{project.target_platform}</div>
            </div>
            <div>
              <label className="label">画面比例</label>
              <div className="text-gray-300 font-mono bg-background-dark px-3 py-2 rounded border border-border-dark">{project.aspect_ratio}</div>
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
            <button onClick={() => setIsEpisodeModalOpen(false)} className="btn bg-surface-dark border border-border-dark hover:bg-border-dark text-white">
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
            <button onClick={() => setIsCharacterModalOpen(false)} className="btn bg-surface-dark border border-border-dark hover:bg-border-dark text-white">
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
    </div>
  )
}