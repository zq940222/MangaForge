export { apiClient } from './client'
export { projectsApi } from './projects'
export { charactersApi } from './characters'
export { episodesApi } from './episodes'
export { generationApi } from './generation'
export { configApi } from './config'

export type { Project, ProjectCreate, ProjectUpdate, ProjectListResponse } from './projects'
export type { Character, CharacterCreate, CharacterUpdate } from './characters'
export type { Episode, Shot, EpisodeCreate, EpisodeUpdate } from './episodes'
export type {
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
  GenerationResult,
} from './generation'
export type {
  Provider,
  UserConfig,
  UserConfigCreate,
  UserConfigUpdate,
  TestConnectionRequest,
  TestConnectionResponse,
} from './config'
