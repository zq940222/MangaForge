import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { charactersApi, CharacterCreate } from '../api/characters'
import type { Character } from '../api/characters'

export function Characters() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCharacter, setNewCharacter] = useState<CharacterCreate>({
    name: '',
    description: '',
    gender: '',
    age_range: '',
    personality: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  const queryClient = useQueryClient()

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(1, 100),
  })

  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ['characters', selectedProjectId],
    queryFn: () => charactersApi.list(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const createCharacterMutation = useMutation({
    mutationFn: (data: CharacterCreate) => charactersApi.create(selectedProjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', selectedProjectId] })
      setShowCreateModal(false)
      setNewCharacter({ name: '', description: '', gender: '', age_range: '', personality: '' })
    },
  })

  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => charactersApi.delete(selectedProjectId, characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', selectedProjectId] })
    },
  })

  const projects = projectsData?.items || []

  const filteredCharacters = characters?.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const getCharacterStatus = (char: Character) => {
    if (char.voice_id && char.reference_images?.length) return 'READY'
    if (!char.voice_sample_path && !char.voice_id) return 'MISSING_VOICE'
    return 'DRAFT'
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        {/* Page Heading & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-white text-4xl font-bold tracking-tight">Character Library</h1>
            <p className="text-[#9da6b9] text-base max-w-2xl">
              Manage your cast, train LoRA models for visual consistency, and configure voice agents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedProjectId}
              className="flex items-center gap-2 px-5 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Character</span>
            </button>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-dark/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="text-sm font-medium text-text-secondary whitespace-nowrap">Select Project:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 md:w-64 bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
              disabled={projectsLoading}
            >
              <option value="">-- Select a project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          {selectedProjectId && (
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9da6b9]">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-[#111318] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="Search characters by name..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {!selectedProjectId ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-surface-dark rounded-xl border border-border-dark">
            <span className="material-symbols-outlined text-6xl mb-4">folder_open</span>
            <p className="text-lg font-medium mb-2">Select a Project</p>
            <p className="text-sm">Choose a project above to view and manage its characters</p>
          </div>
        ) : charactersLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-surface-dark rounded-xl border border-border-dark">
            <span className="material-symbols-outlined text-6xl mb-4">group</span>
            <p className="text-lg font-medium mb-2">No Characters Yet</p>
            <p className="text-sm mb-4">Add characters to define your story's cast</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-bold text-white transition-colors"
            >
              Add First Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCharacters.map((char) => {
              const status = getCharacterStatus(char)
              return (
                <div
                  key={char.id}
                  className="group relative flex flex-col bg-surface-dark rounded-xl overflow-hidden border border-[#282e39] hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                >
                  {/* Image Area */}
                  <div className="relative aspect-[3/4] w-full bg-gray-900">
                    {char.reference_images?.[0] ? (
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={char.reference_images[0]}
                        alt={char.name}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <span className="material-symbols-outlined text-[64px] text-white/20">person</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-90"></div>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {status === 'READY' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Ready
                        </span>
                      )}
                      {status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-700/50 text-gray-300 border border-gray-600/30 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Draft
                        </span>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (confirm('Delete this character?')) {
                          deleteCharacterMutation.mutate(char.id)
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>

                  {/* Info Content */}
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h3 className="text-white text-xl font-bold">{char.name}</h3>
                      <p className="text-[#9da6b9] text-sm">
                        {char.gender === 'male' ? 'Male' : char.gender === 'female' ? 'Female' : char.gender || 'Unknown'}
                        {char.age_range && ` · ${char.age_range}`}
                      </p>
                    </div>

                    {char.description && (
                      <p className="text-text-secondary text-xs line-clamp-2">{char.description}</p>
                    )}

                    {/* Voice Status */}
                    {status === 'MISSING_VOICE' ? (
                      <div className="flex items-center justify-between gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-400 text-[18px]">mic_off</span>
                          <span className="text-xs text-red-100 font-medium">Voice Missing</span>
                        </div>
                      </div>
                    ) : char.voice_id ? (
                      <div className="flex items-center gap-2 p-2 rounded bg-[#111318] border border-gray-800">
                        <span className="material-symbols-outlined text-primary text-[18px]">graphic_eq</span>
                        <span className="text-xs text-white font-medium">Voice Ready</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}

            {/* Add New Placeholder Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group flex flex-col items-center justify-center bg-[#151a23] rounded-xl border-2 border-dashed border-[#282e39] hover:border-primary/50 hover:bg-[#1a202c] transition-all duration-300 min-h-[400px]"
            >
              <div className="w-16 h-16 rounded-full bg-[#282e39] group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-[32px]">add</span>
              </div>
              <h3 className="text-white text-lg font-bold">Add New Character</h3>
              <p className="text-[#9da6b9] text-sm mt-1">Create from scratch</p>
            </button>
          </div>
        )}
      </div>

      {/* Create Character Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-dark border border-border-dark rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Add New Character</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="Character name..."
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                    Gender
                  </label>
                  <select
                    value={newCharacter.gender}
                    onChange={(e) => setNewCharacter({ ...newCharacter, gender: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                    Age Range
                  </label>
                  <select
                    value={newCharacter.age_range}
                    onChange={(e) => setNewCharacter({ ...newCharacter, age_range: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select...</option>
                    <option value="child">Child</option>
                    <option value="teen">Teen</option>
                    <option value="young_adult">Young Adult</option>
                    <option value="middle_aged">Middle Aged</option>
                    <option value="elderly">Elderly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Physical appearance, clothing style..."
                  value={newCharacter.description}
                  onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                  Personality
                </label>
                <input
                  type="text"
                  placeholder="e.g., cheerful, mysterious, calm..."
                  value={newCharacter.personality}
                  onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
                  className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createCharacterMutation.mutate(newCharacter)}
                disabled={!newCharacter.name.trim() || createCharacterMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
              >
                {createCharacterMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
