import { create } from 'zustand'
import { Project } from '../api/projects'
import { Character } from '../api/characters'
import { Episode } from '../api/episodes'

interface ProjectState {
  // Current project
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // Characters for current project
  characters: Character[]
  setCharacters: (characters: Character[]) => void
  addCharacter: (character: Character) => void
  updateCharacter: (character: Character) => void
  removeCharacter: (characterId: string) => void

  // Episodes for current project
  episodes: Episode[]
  setEpisodes: (episodes: Episode[]) => void
  addEpisode: (episode: Episode) => void
  updateEpisode: (episode: Episode) => void
  removeEpisode: (episodeId: string) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Reset
  reset: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) => set((state) => ({
    characters: [...state.characters, character]
  })),
  updateCharacter: (character) => set((state) => ({
    characters: state.characters.map((c) => c.id === character.id ? character : c)
  })),
  removeCharacter: (characterId) => set((state) => ({
    characters: state.characters.filter((c) => c.id !== characterId)
  })),

  episodes: [],
  setEpisodes: (episodes) => set({ episodes }),
  addEpisode: (episode) => set((state) => ({
    episodes: [...state.episodes, episode]
  })),
  updateEpisode: (episode) => set((state) => ({
    episodes: state.episodes.map((e) => e.id === episode.id ? episode : e)
  })),
  removeEpisode: (episodeId) => set((state) => ({
    episodes: state.episodes.filter((e) => e.id !== episodeId)
  })),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  reset: () => set({
    currentProject: null,
    characters: [],
    episodes: [],
    isLoading: false,
  }),
}))
