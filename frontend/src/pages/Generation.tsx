import { Header } from '../components/layout/Header'
import { useState } from 'react'

// This will act as our "Project Detail" page for now, but really it's the Editor Workspace.
// In the future, Project Detail might be a dashboard for the project, and this would be /editor
export function Generation() {
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden relative">
        {/* Quick Publish Drawer */}
        {isPublishDrawerOpen && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition-opacity">
                <div className="w-[400px] h-full bg-[#101622] border-l border-[#282e39] shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
                    <div className="px-6 py-4 border-b border-[#282e39] flex items-center justify-between bg-[#15191f]">
                        <div>
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">rocket_launch</span>
                                One-Click Publish
                            </h2>
                            <p className="text-[#9da6b9] text-xs mt-0.5">Distribute to authorized platforms</p>
                        </div>
                        <button 
                            onClick={() => setIsPublishDrawerOpen(false)}
                            className="text-[#9da6b9] hover:text-white transition-colors rounded-full hover:bg-white/10 p-1"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="bg-[#1c1f27] rounded-xl p-3 border border-[#282e39] flex gap-4 hover:border-border-dark/80 transition-colors">
                            <div className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden relative shrink-0">
                                <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQvaBgyu0utfp6-7Lz6TOUhlrXEoylCV_4O9FOVg5MO5PL_XGiIRYdnbPCyPrpaMaIu80-Vo2L90FTiCOep9VlQsXSbihuNLC4BHHPFj-x2nuhAMMhI3MJk6SwvDk5-nkEZfGkd7pT2vn6po4d7eziR0cjZAZOqaPA5SQTuPlRKbQ-hSXMA5TpEWNiAK9RhwBrfsvtd_Jq6gExkbDZdZKrz_Oh3N4ciuBp01UyMiDN1iq1-SdivcMbrEoBIpuRoLYXfG5OoWmoOEvA")', filter: 'brightness(0.9)'}}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white/90 text-2xl drop-shadow-md">play_circle</span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center gap-1 min-w-0">
                                <h4 className="text-white text-sm font-bold truncate">Cyber-Samurai Ep. 1.mp4</h4>
                                <p className="text-[#9da6b9] text-xs">00:45 • 1080p • 60fps</p>
                                <span className="inline-flex items-center gap-1 text-green-400 text-xs mt-1 bg-green-400/10 px-2 py-0.5 rounded w-fit border border-green-400/20">
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Ready
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider block mb-3">Target Platforms</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 transition-all relative">
                                    <div className="absolute top-1.5 right-1.5 text-pink-500">
                                        <span className="material-symbols-outlined text-[16px] icon-filled">check_circle</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">live_tv</span>
                                    </div>
                                    <span className="text-xs font-medium text-pink-200">Bilibili</span>
                                </button>
                                <button className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-[#282e39] bg-[#1c1f27] hover:border-white/30 transition-all relative opacity-60 hover:opacity-100">
                                    <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">music_note</span>
                                    </div>
                                    <span className="text-xs font-medium text-[#9da6b9] group-hover:text-white">Douyin</span>
                                </button>
                                <button className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-[#282e39] bg-[#1c1f27] hover:border-orange-500/50 transition-all relative opacity-60 hover:opacity-100">
                                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">videocam</span>
                                    </div>
                                    <span className="text-xs font-medium text-[#9da6b9] group-hover:text-white">Kuaishou</span>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider">Video Title</label>
                                <input className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-[#9da6b9]/50 transition-colors" type="text" defaultValue="Cyber Samurai: Neon Rain (Ep. 1)"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider">Description</label>
                                <textarea className="w-full h-24 bg-[#1c1f27] border border-[#282e39] rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-[#9da6b9]/50 resize-none transition-colors" defaultValue="The rain never stops in sector 7. Follow the journey of the last samurai in a world consumed by neon and steel. #anime #cyberpunk #aiart"></textarea>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#9da6b9] text-xs font-bold uppercase tracking-wider">Hashtags</label>
                                <div className="flex flex-wrap gap-2 bg-[#1c1f27] border border-[#282e39] rounded-lg p-2 min-h-[42px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                                    <span className="bg-primary/20 text-blue-200 border border-primary/20 text-xs px-2 py-1 rounded flex items-center gap-1">
                                        #cyberpunk <button className="hover:text-white"><span className="material-symbols-outlined text-[10px]">close</span></button>
                                    </span>
                                    <span className="bg-primary/20 text-blue-200 border border-primary/20 text-xs px-2 py-1 rounded flex items-center gap-1">
                                        #anime <button className="hover:text-white"><span className="material-symbols-outlined text-[10px]">close</span></button>
                                    </span>
                                    <input className="bg-transparent border-none outline-none text-white text-xs w-20 p-0 h-5 focus:ring-0 placeholder-[#9da6b9]/50" placeholder="Add tag..." type="text"/>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 pt-2 border-t border-[#282e39]">
                            <div className="flex items-center justify-between group cursor-pointer">
                                <span className="text-sm text-white font-medium group-hover:text-primary transition-colors">Allow Duet / Remix</span>
                                <button className="w-9 h-5 bg-primary rounded-full relative transition-colors">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between group cursor-pointer">
                                <span className="text-sm text-white font-medium group-hover:text-primary transition-colors">Save to Device</span>
                                <button className="w-9 h-5 bg-[#282e39] border border-border-dark rounded-full relative transition-colors">
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-[#9da6b9] rounded-full shadow-sm"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-[#282e39] bg-[#15191f]">
                        <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl h-12 font-bold text-base shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform active:scale-[0.98]">
                            <span className="material-symbols-outlined icon-filled">rocket_launch</span>
                            <span>Publish to Selected (1)</span>
                        </button>
                        <p className="text-[10px] text-[#9da6b9] text-center mt-3">
                            By publishing, you agree to the content policies of selected platforms.
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* LEFT PANEL: Script Editor */}
        <aside className="w-[340px] flex flex-col border-r border-border-dark bg-background-dark z-10 shrink-0">
            <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-white tracking-light text-xl font-bold leading-tight">Script Editor</h3>
                <button className="text-text-secondary hover:text-white"><span className="material-symbols-outlined">dock_to_left</span></button>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto px-4 py-2 space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider">Story Context / Outline</label>
                    <textarea className="form-input w-full resize-none rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-border-dark bg-surface-dark placeholder:text-text-secondary/50 p-3 text-sm font-normal leading-relaxed min-h-[160px]" placeholder="Enter your story outline here... E.g. A cyberpunk samurai walks through a neon-lit rainstorm looking for the lost chip."></textarea>
                </div>
                <button className="group flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-surface-dark border border-border-dark text-white gap-2 text-sm font-bold hover:border-primary/50 hover:bg-surface-dark/80 transition-all">
                    <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-300">auto_awesome</span>
                    <span>Expand Outline to Shots</span>
                </button>
                <div className="w-full h-px bg-border-dark my-2"></div>
                <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Scene Breakdown</label>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer">
                        <span className="text-primary font-bold text-xs mt-0.5">01</span>
                        <div className="flex-1">
                            <p className="text-white text-sm font-medium line-clamp-2">Establishing shot: Neon city streets, heavy rain.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-dark border border-transparent hover:border-border-dark cursor-pointer transition-colors">
                        <span className="text-text-secondary font-bold text-xs mt-0.5">02</span>
                        <div className="flex-1">
                            <p className="text-text-secondary text-sm font-medium line-clamp-2">Close up: Protagonist's boots splashing in a puddle.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-dark border border-transparent hover:border-border-dark cursor-pointer transition-colors">
                        <span className="text-text-secondary font-bold text-xs mt-0.5">03</span>
                        <div className="flex-1">
                            <p className="text-text-secondary text-sm font-medium line-clamp-2">Mid shot: He looks up at the towering holographic ad.</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        {/* MIDDLE PANEL: Timeline / Canvas */}
        <main className="flex-1 flex flex-col min-w-[500px] bg-[#15191f] relative">
            <div className="h-12 border-b border-border-dark flex items-center justify-between px-4 bg-background-dark/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white mr-4">Timeline</h3>
                    <button className="p-1.5 rounded hover:bg-surface-dark text-white"><span className="material-symbols-outlined">add_circle</span></button>
                    <button className="p-1.5 rounded hover:bg-surface-dark text-text-secondary hover:text-white"><span className="material-symbols-outlined">content_cut</span></button>
                    <button className="p-1.5 rounded hover:bg-surface-dark text-text-secondary hover:text-white"><span className="material-symbols-outlined">delete</span></button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Zoom</span>
                    <input className="w-24 h-1 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary" type="range"/>
                </div>
                {/* Header Action for Quick Publish (Only visible in this context if we want it here, but typically header actions are in the main Header) 
                    Wait, the design shows this button in the main header in the final screenshot. 
                    However, `Generation.tsx` does NOT render the main header, it renders inside the Layout.
                    Let's add a local Quick Publish button here in the Toolbar if we can't easily modify the global header contextually.
                    Actually, looking at the layout, the global header is above this.
                    I will add a Quick Publish button to this local toolbar for easy access as well.
                */}
                <button 
                    onClick={() => setIsPublishDrawerOpen(true)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-purple-500/20"
                >
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                    Quick Publish
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pb-32 space-y-6">
                {/* Shot 1 */}
                <div className="flex gap-4 group">
                    <div className="flex flex-col items-center pt-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(19,91,236,0.5)]">1</div>
                        <div className="w-0.5 flex-1 bg-border-dark group-hover:bg-primary/50 transition-colors my-2"></div>
                    </div>
                    <div className="flex-1 bg-surface-dark rounded-xl border border-primary/50 shadow-lg p-1 flex flex-col md:flex-row gap-0 overflow-hidden relative ring-1 ring-primary/20">
                        <div className="w-full md:w-[280px] aspect-video bg-black relative group/media">
                            <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQvaBgyu0utfp6-7Lz6TOUhlrXEoylCV_4O9FOVg5MO5PL_XGiIRYdnbPCyPrpaMaIu80-Vo2L90FTiCOep9VlQsXSbihuNLC4BHHPFj-x2nuhAMMhI3MJk6SwvDk5-nkEZfGkd7pT2vn6po4d7eziR0cjZAZOqaPA5SQTuPlRKbQ-hSXMA5TpEWNiAK9RhwBrfsvtd_Jq6gExkbDZdZKrz_Oh3N4ciuBp01UyMiDN1iq1-SdivcMbrEoBIpuRoLYXfG5OoWmoOEvA")'}}></div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity cursor-pointer">
                                <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-1">
                                <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">00:04s</span>
                                <span className="bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">videocam</span> Video
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between gap-4">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-white font-bold text-sm">Ext. Neon Street - Night</h4>
                                    <div className="flex gap-1">
                                        <button className="text-text-secondary hover:text-white p-1" title="Regenerate"><span className="material-symbols-outlined text-[18px]">refresh</span></button>
                                        <button className="text-text-secondary hover:text-white p-1" title="Edit Prompt"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                    </div>
                                </div>
                                <div className="bg-background-dark/50 p-2.5 rounded border border-border-dark/50 mb-3">
                                    <p className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">record_voice_over</span> Dialogue
                                    </p>
                                    <p className="text-gray-300 text-sm italic">"The rain never stops here. It just changes color."</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-dark/30">
                                <div className="flex gap-2">
                                    <span className="text-[10px] bg-border-dark text-text-secondary px-2 py-0.5 rounded-full">Kling v1.2</span>
                                    <span className="text-[10px] bg-border-dark text-text-secondary px-2 py-0.5 rounded-full">Fish-Speech</span>
                                </div>
                                <div className="flex gap-1">
                                    <button className="text-text-secondary hover:text-green-400"><span className="material-symbols-outlined text-[18px]">thumb_up</span></button>
                                    <button className="text-text-secondary hover:text-red-400"><span className="material-symbols-outlined text-[18px]">thumb_down</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shot 2 */}
                <div className="flex gap-4 group">
                    <div className="flex flex-col items-center pt-2">
                        <div className="w-6 h-6 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-[10px] font-bold text-text-secondary">2</div>
                        <div className="w-0.5 flex-1 bg-border-dark my-2"></div>
                    </div>
                    <div className="flex-1 bg-surface-dark rounded-xl border border-border-dark p-1 flex flex-col md:flex-row gap-0 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="w-full md:w-[280px] aspect-video bg-[#15171e] relative flex flex-col items-center justify-center border-r border-border-dark/50">
                            <span className="material-symbols-outlined text-text-secondary/30 text-5xl mb-2">movie_filter</span>
                            <span className="text-text-secondary/50 text-xs font-medium">Waiting to generate</span>
                        </div>
                        <div className="flex-1 p-4 flex flex-col gap-3">
                            <div>
                                <h4 className="text-white font-bold text-sm mb-2">Cu. Boots splashing</h4>
                                <div className="bg-background-dark/50 p-2.5 rounded border border-border-dark/50">
                                    <p className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">description</span> Prompt
                                    </p>
                                    <p className="text-gray-400 text-sm">Close up shot, low angle, heavy leather boots stepping into a neon-reflecting puddle, splashes of water, high fidelity, 8k.</p>
                                </div>
                            </div>
                            <div className="mt-auto flex justify-end">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">play_arrow</span> Generate Shot
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <span className="material-symbols-outlined text-primary">psychology</span> Agent Configuration
                    </h3>
                    {/* Video Model Select */}
                    <div className="space-y-3 mb-6">
                        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider block">Visual Model</label>
                        <div className="relative">
                            <select className="w-full appearance-none bg-surface-dark border border-border-dark text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                                <option>Kling Pro v1.5 (Recommended)</option>
                                <option>Midjourney v6 + Runway</option>
                                <option>Stable Diffusion XL Anime</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none text-[20px]">expand_more</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Ready to generate
                        </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider block">Audio / TTS Model</label>
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
                                <label className="text-text-secondary text-xs font-bold">Motion Scale</label>
                                <span className="text-white text-xs font-mono">0.75</span>
                            </div>
                            <input className="w-full h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary" type="range" defaultValue="75"/>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-text-secondary text-xs font-bold">Creativity</label>
                                <span className="text-white text-xs font-mono">High</span>
                            </div>
                            <input className="w-full h-1.5 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-purple-500" type="range" defaultValue="80"/>
                        </div>
                    </div>
                </div>
                
                <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm font-bold">Queue Status</span>
                        <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-0.5 rounded">Idle</span>
                    </div>
                    <ul className="space-y-2">
                        <li className="flex justify-between text-xs">
                            <span className="text-text-secondary">Pending Shots</span>
                            <span className="text-white">2</span>
                        </li>
                        <li className="flex justify-between text-xs">
                            <span className="text-text-secondary">Est. Time</span>
                            <span className="text-white">~45s</span>
                        </li>
                        <li className="flex justify-between text-xs">
                            <span className="text-text-secondary">Cost</span>
                            <span className="text-white">12 credits</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="p-5 border-t border-border-dark bg-surface-dark">
                <button className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-blue-600 text-white rounded-lg h-12 font-bold text-base shadow-[0_0_15px_rgba(19,91,236,0.4)] transition-all hover:shadow-[0_0_20px_rgba(19,91,236,0.6)] transform hover:-translate-y-0.5">
                    <span className="material-symbols-outlined icon-filled">smart_toy</span>
                    <span>Generate All (2)</span>
                </button>
            </div>
        </aside>
    </div>
  )
}