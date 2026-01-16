import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QuickPublishDrawer } from '../components/QuickPublishDrawer'
import { useEpisode, useUpdateEpisode, useExpandEpisode } from '../hooks/useEpisodes'
import { useProject } from '../hooks/useProjects'
import { useGeneration } from '../hooks/useGeneration'

// This will act as our "Project Detail" page for now, but really it's the Editor Workspace.
// In the future, Project Detail might be a dashboard for the project, and this would be /editor
export function Generation() {
  const { t } = useTranslation()
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId: string }>()

  const { data: project } = useProject(projectId)
  const { data: episode, isLoading: episodeLoading } = useEpisode(projectId, episodeId, true)
  const generation = useGeneration()
  const updateEpisode = useUpdateEpisode()
  const expandEpisode = useExpandEpisode()

  // Script input state
  const [scriptInput, setScriptInput] = useState('')

  // Sync script input with episode data
  useEffect(() => {
    if (episode?.script_input) {
      setScriptInput(episode.script_input)
    }
  }, [episode?.script_input])

  // Handle Generate All button click
  const handleGenerateAll = () => {
    if (!episode?.id) return
    generation.startGeneration({
      episode_id: episode.id,
      style: project?.style,
      add_subtitles: true,
    })
  }

  // Handle Expand Outline to Shots button click
  const handleExpandOutline = async () => {
    if (!projectId || !episodeId) return

    // First save the script input if it changed
    if (scriptInput !== episode?.script_input) {
      await updateEpisode.mutateAsync({
        projectId,
        episodeId,
        data: { script_input: scriptInput },
      })
    }

    // Then expand
    expandEpisode.mutate({ projectId, episodeId })
  }

  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false)

  // Episode data - use real data if available, otherwise use mock
  const currentEpisodeId = episode?.id || undefined
  const currentEpisodeTitle = episode?.title || project?.title || 'Cyber-Samurai Ep. 1'
  const shots = episode?.shots || []

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
        {/* Quick Publish Drawer */}
        <QuickPublishDrawer
          isOpen={isPublishDrawerOpen}
          onClose={() => setIsPublishDrawerOpen(false)}
          episodeId={currentEpisodeId}
          episodeTitle={currentEpisodeTitle}
          duration={formatDuration(episode?.duration)}
        />

        {/* LEFT PANEL: Script Editor */}
        <aside className="w-[340px] flex flex-col border-r border-border-dark bg-background-dark z-10 shrink-0">
            <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-white tracking-light text-xl font-bold leading-tight">{t('generation.scriptEditor')}</h3>
                <button className="text-text-secondary hover:text-white"><span className="material-symbols-outlined">dock_to_left</span></button>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto px-4 py-2 space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">{t('generation.storyOutline')}</label>
                    <textarea
                      value={scriptInput}
                      onChange={(e) => setScriptInput(e.target.value)}
                      className="form-input w-full resize-none rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-border-dark bg-surface-dark placeholder:text-text-secondary/50 p-3 text-sm font-normal leading-relaxed min-h-[160px]"
                      placeholder={t('generation.storyOutlinePlaceholder')}
                    />
                </div>
                <button
                  onClick={handleExpandOutline}
                  disabled={expandEpisode.isPending || !scriptInput.trim() || !episodeId}
                  className="group flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-surface-dark border border-border-dark text-white gap-2 text-sm font-bold hover:border-primary/50 hover:bg-surface-dark/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className={`material-symbols-outlined text-purple-400 group-hover:text-purple-300 ${expandEpisode.isPending ? 'animate-spin' : ''}`}>
                      {expandEpisode.isPending ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    <span>{expandEpisode.isPending ? t('generation.expanding') : t('generation.expandOutline')}</span>
                </button>
                <div className="w-full h-px bg-border-dark my-2"></div>
                <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">{t('generation.sceneBreakdown')}</label>
                    {shots.length === 0 ? (
                      <div className="text-text-secondary text-sm text-center py-4">
                        {t('generation.noShotsYet')}
                      </div>
                    ) : (
                      shots.map((shot, index) => (
                        <div
                          key={shot.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            index === 0
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-surface-dark border border-transparent hover:border-border-dark'
                          }`}
                        >
                          <span className={`font-bold text-xs mt-0.5 ${index === 0 ? 'text-primary' : 'text-text-secondary'}`}>
                            {String(shot.shot_number).padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <p className={`text-sm font-medium line-clamp-2 ${index === 0 ? 'text-white' : 'text-text-secondary'}`}>
                              {shot.scene_description || shot.dialog?.text || 'No description'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                </div>
            </div>
        </aside>

        {/* MIDDLE PANEL: Timeline / Canvas */}
        <main className="flex-1 flex flex-col min-w-[500px] bg-[#15191f] relative">
            <div className="h-12 border-b border-border-dark flex items-center justify-between px-4 bg-background-dark/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white mr-4">{t('generation.timeline')}</h3>
                    <button className="p-1.5 rounded hover:bg-surface-dark text-white"><span className="material-symbols-outlined">add_circle</span></button>
                    <button className="p-1.5 rounded hover:bg-surface-dark text-text-secondary hover:text-white"><span className="material-symbols-outlined">content_cut</span></button>
                    <button className="p-1.5 rounded hover:bg-surface-dark text-text-secondary hover:text-white"><span className="material-symbols-outlined">delete</span></button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{t('generation.zoom')}</span>
                    <input className="w-24 h-1 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary" type="range"/>
                </div>
                <button 
                    onClick={() => setIsPublishDrawerOpen(true)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-purple-500/20"
                >
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                    {t('distribution.quickPublish')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pb-32 space-y-6">
                {shots.length === 0 ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <span className="material-symbols-outlined text-text-secondary/30 text-7xl mb-4">movie_creation</span>
                    <h3 className="text-white text-lg font-bold mb-2">{t('generation.noShotsTitle')}</h3>
                    <p className="text-text-secondary text-sm max-w-md">
                      {t('generation.noShotsDescription')}
                    </p>
                  </div>
                ) : (
                  /* Render shots dynamically */
                  shots.map((shot, index) => {
                    const isFirst = index === 0
                    const hasMedia = shot.image_path || shot.video_path
                    const isGenerated = shot.status === 'completed'

                    return (
                      <div key={shot.id} className="flex gap-4 group">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center pt-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isFirst
                              ? 'bg-primary text-white shadow-[0_0_10px_rgba(19,91,236,0.5)]'
                              : 'bg-surface-dark border border-border-dark text-text-secondary'
                          }`}>
                            {shot.shot_number}
                          </div>
                          {index < shots.length - 1 && (
                            <div className={`w-0.5 flex-1 my-2 ${isFirst ? 'bg-border-dark group-hover:bg-primary/50' : 'bg-border-dark'} transition-colors`}></div>
                          )}
                        </div>

                        {/* Shot card */}
                        <div className={`flex-1 bg-surface-dark rounded-xl p-1 flex flex-col md:flex-row gap-0 overflow-hidden transition-opacity ${
                          isFirst
                            ? 'border border-primary/50 shadow-lg ring-1 ring-primary/20'
                            : 'border border-border-dark opacity-80 hover:opacity-100'
                        }`}>
                          {/* Media preview */}
                          <div className="w-full md:w-[280px] aspect-video bg-[#15171e] relative group/media">
                            {hasMedia ? (
                              <>
                                <div
                                  className="absolute inset-0 bg-cover bg-center opacity-80"
                                  style={{backgroundImage: `url("${shot.video_path || shot.image_path}")`}}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity cursor-pointer">
                                  <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                                </div>
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                  {shot.duration && (
                                    <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">
                                      {formatDuration(shot.duration)}
                                    </span>
                                  )}
                                  <span className="bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">{shot.video_path ? 'videocam' : 'image'}</span>
                                    {shot.video_path ? t('assetLibrary.videos') : t('assetLibrary.images')}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center border-r border-border-dark/50">
                                <span className="material-symbols-outlined text-text-secondary/30 text-5xl mb-2">movie_filter</span>
                                <span className="text-text-secondary/50 text-xs font-medium">{t('generation.waitingToGenerate')}</span>
                              </div>
                            )}
                          </div>

                          {/* Shot details */}
                          <div className="flex-1 p-4 flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-white font-bold text-sm">
                                  {shot.scene_description || `Shot ${shot.shot_number}`}
                                </h4>
                                <div className="flex gap-1">
                                  <button className="text-text-secondary hover:text-white p-1" title={t('generation.regenerate')}>
                                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                                  </button>
                                  <button className="text-text-secondary hover:text-white p-1" title={t('generation.editPrompt')}>
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>
                                </div>
                              </div>

                              {/* Dialog or Prompt */}
                              {shot.dialog?.text ? (
                                <div className="bg-background-dark/50 p-2.5 rounded border border-border-dark/50 mb-3">
                                  <p className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">record_voice_over</span> {t('generation.dialogue')}
                                  </p>
                                  <p className="text-gray-300 text-sm italic">"{shot.dialog.text}"</p>
                                </div>
                              ) : shot.image_prompt ? (
                                <div className="bg-background-dark/50 p-2.5 rounded border border-border-dark/50 mb-3">
                                  <p className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">description</span> {t('generation.prompt')}
                                  </p>
                                  <p className="text-gray-400 text-sm">{shot.image_prompt}</p>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-dark/30">
                              {isGenerated ? (
                                <>
                                  <div className="flex gap-2">
                                    <span className="text-[10px] bg-border-dark text-text-secondary px-2 py-0.5 rounded-full">
                                      {shot.video_path ? 'Kling' : 'ComfyUI'}
                                    </span>
                                    {shot.audio_path && (
                                      <span className="text-[10px] bg-border-dark text-text-secondary px-2 py-0.5 rounded-full">
                                        Edge-TTS
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <button className="text-text-secondary hover:text-green-400">
                                      <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                    </button>
                                    <button className="text-text-secondary hover:text-red-400">
                                      <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex justify-end w-full">
                                  <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">play_arrow</span> {t('generation.generateShot')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
            </div>
        </main>

        {/* RIGHT PANEL: Agent Config */}
        <aside className="w-[380px] flex flex-col border-l border-border-dark bg-background-dark z-10 shrink-0">
             {/* Preview Window */}
             <div className="w-full aspect-video bg-black relative border-b border-border-dark group">
                <div className="absolute inset-0 bg-center bg-cover opacity-60" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCAWnyTj9Kf-BncOck8D5cho3yiXB4OJmTDavmjauh-ipspzXstNtC2vj8HTCzTVtPY8EiVhS48DGyx0t3lgYHDatSmEVw_FkcstAK46YFKqJ1xPLd4argdIhxoNUqvUgopiclsCfce_9HmbQ0rZWgCQ27JaApHzEWIP4vbISqe3kNHUiiQsqrtPjHVWhqQp-HC8SXInTzOPRsxyDOLz1ADr65uEM7nHKrzTd2wk0AzjKtJmGwbPCT7M4ooKen9FeNrTgd965oUxKQr")'}}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
                        <span className="material-symbols-outlined text-white icon-filled">play_arrow</span>
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-mono text-white/80">PREVIEW: SHOT 01</span>
                        <span className="text-xs font-mono text-white/80">00:00 / 00:04</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="w-1/3 h-full bg-primary"></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                    <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">psychology</span> {t('generation.agentConfiguration')}
                    </h3>
                    {/* Video Model Select */}
                    <div className="space-y-3 mb-6">
                        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider block">{t('generation.visualModel')}</label>
                        <div className="relative">
                            <select className="w-full appearance-none bg-surface-dark border border-border-dark text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                                <option>Kling Pro v1.5 (Recommended)</option>
                                <option>Midjourney v6 + Runway</option>
                                <option>Stable Diffusion XL Anime</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none text-[20px]">expand_more</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> {t('generation.readyToGenerate')}
                        </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider block">{t('generation.audioModel')}</label>
                        <div className="relative">
                            <select className="w-full appearance-none bg-surface-dark border border-border-dark text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                                <option>Fish-Speech (Cinematic)</option>
                                <option>ElevenLabs (Anime V2)</option>
                                <option>OpenVoice Local</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none text-[20px]">expand_more</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-border-dark/50">
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-text-secondary text-xs font-bold">{t('generation.motionScale')}</label>
                                <span className="text-white text-xs font-mono">0.75</span>
                            </div>
                            <input className="w-full h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary" type="range" defaultValue="75"/>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-text-secondary text-xs font-bold">{t('generation.creativity')}</label>
                                <span className="text-white text-xs font-mono">{t('generation.high')}</span>
                            </div>
                            <input className="w-full h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-purple-500" type="range" defaultValue="80"/>
                        </div>
                    </div>
                </div>
                
                <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm font-bold">{t('generation.queueStatus')}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          generation.status === 'running'
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-primary bg-primary/10'
                        }`}>
                          {generation.status === 'running' ? t('generation.generating') : t('generation.idle')}
                        </span>
                    </div>
                    <ul className="space-y-2">
                        <li className="flex justify-between text-xs">
                            <span className="text-text-secondary">{t('generation.pendingShots')}</span>
                            <span className="text-white">{shots.filter(s => s.status === 'pending').length || shots.length || 2}</span>
                        </li>
                        <li className="flex justify-between text-xs">
                            <span className="text-text-secondary">{t('generation.estTime')}</span>
                            <span className="text-white">~{(shots.length || 2) * 20}s</span>
                        </li>
                        <li className="flex justify-between text-xs">
                            <span className="text-text-secondary">{t('generation.cost')}</span>
                            <span className="text-white">{(shots.length || 2) * 6} {t('generation.credits')}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="p-5 border-t border-border-dark bg-surface-dark">
                <button
                  onClick={handleGenerateAll}
                  disabled={generation.status === 'running' || episodeLoading || !episode?.id}
                  className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-blue-600 text-white rounded-lg h-12 font-bold text-base shadow-[0_0_15px_rgba(19,91,236,0.4)] transition-all hover:shadow-[0_0_20px_rgba(19,91,236,0.6)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className={`material-symbols-outlined icon-filled ${generation.status === 'running' ? 'animate-spin' : ''}`}>
                      {generation.status === 'running' ? 'progress_activity' : 'smart_toy'}
                    </span>
                    <span>
                      {generation.status === 'running'
                        ? t('generation.generatingProgress', { progress: generation.overallProgress })
                        : t('generation.generateAllCount', { count: shots.length || 2 })}
                    </span>
                </button>
            </div>
        </aside>
    </div>
  )
}