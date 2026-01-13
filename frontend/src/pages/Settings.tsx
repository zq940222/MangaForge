export function Settings() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Agent Neural Configuration</h1>
          <p className="text-text-secondary text-base font-normal leading-relaxed">
            Manage the external cognitive services that power your MangaForge agent. 
            Configure API keys for LLMs, image synthesis, video generation, and voice cloning models.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
          <span className="material-symbols-outlined text-[20px]">save</span>
          <span>Save All Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* LLM Card */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-dark pb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">LLM Services</h3>
              <p className="text-xs text-text-secondary">Text generation & reasoning engines</p>
            </div>
          </div>
          
          {/* OpenAI */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">OpenAI</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-green-400 font-medium">Connected</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">API Key</label>
              <div className="relative">
                <input className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" placeholder="sk-..." type="password" defaultValue="sk-proj-**********************"/>
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white">
                  <span className="material-symbols-outlined text-lg">visibility_off</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Model</label>
                <div className="relative">
                  <select className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer">
                    <option>gpt-4o</option>
                    <option>gpt-4-turbo</option>
                    <option>gpt-3.5-turbo</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-lg">expand_more</span>
                </div>
              </div>
              <div className="flex items-end">
                <button className="w-full h-[42px] flex items-center justify-center gap-2 rounded-lg border border-border-dark hover:bg-border-dark text-white text-xs font-bold transition-colors">
                  <span className="material-symbols-outlined text-base">wifi</span>
                  Test
                </button>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-border-dark w-full"></div>

          {/* DeepSeek */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">DeepSeek</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="text-xs text-red-400 font-medium">Auth Error</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">API Key</label>
              <div className="relative">
                <input className="w-full bg-background-dark border border-red-500/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono" placeholder="ds-..." type="password"/>
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white">
                  <span className="material-symbols-outlined text-lg">visibility_off</span>
                </button>
              </div>
            </div>
            <div className="flex items-end justify-end">
              <button className="w-1/3 h-[42px] flex items-center justify-center gap-2 rounded-lg border border-border-dark hover:bg-border-dark text-white text-xs font-bold transition-colors">
                <span className="material-symbols-outlined text-base">refresh</span>
                Retry
              </button>
            </div>
          </div>
        </div>

        {/* Image Gen Card */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-dark pb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
              <span className="material-symbols-outlined">palette</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Image Synthesis</h3>
              <p className="text-xs text-text-secondary">Visual content generation</p>
            </div>
          </div>
          {/* ComfyUI */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">ComfyUI (Local/Remote)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-green-400 font-medium">WS Connected</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Host URL</label>
              <div className="relative">
                <input className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" placeholder="http://..." type="text" defaultValue="http://127.0.0.1:8188"/>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">check_circle</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background-dark border border-border-dark flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Workflow Status</span>
                <span className="text-xs text-text-secondary">Default_Manga_v2.json</span>
              </div>
              <div className="w-full bg-border-dark rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>Nodes Loaded: 42</span>
                <span>GPU: Ready</span>
              </div>
            </div>
            <div className="flex items-end justify-end pt-2">
              <button className="w-full md:w-auto px-6 h-[42px] flex items-center justify-center gap-2 rounded-lg border border-border-dark hover:bg-border-dark text-white text-xs font-bold transition-colors">
                <span className="material-symbols-outlined text-base">settings_ethernet</span>
                Test WebSocket
              </button>
            </div>
          </div>
        </div>

        {/* Video Gen Card */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border-dark pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <span className="material-symbols-outlined">movie</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Video Rendering</h3>
              <p className="text-xs text-text-secondary">Motion & animation models</p>
            </div>
          </div>
          {/* Kling */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Kling AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gray-600"></span>
                <span className="text-xs text-text-secondary font-medium">Not Configured</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Access Token</label>
              <input className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" placeholder="Paste your Kling token here..." type="password"/>
            </div>
          </div>
          <div className="h-px bg-border-dark w-full"></div>
          {/* Runway */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Runway Gen-3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-green-400 font-medium">Ready</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">API Secret</label>
              <div className="flex gap-2">
                <input className="flex-1 bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" placeholder="key_..." type="password" defaultValue="rwy_****************"/>
                <button className="h-[42px] px-4 flex items-center justify-center gap-2 rounded-lg border border-border-dark hover:bg-border-dark text-white text-xs font-bold transition-colors">
                  <span className="material-symbols-outlined text-base">wifi</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Priority / Fallback Section */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border-dark pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-white">
                <span className="material-symbols-outlined">tune</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Model Priority Strategy</h3>
                <p className="text-xs text-text-secondary">Drag to reorder fallback preference when primary services fail</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background-dark rounded-lg p-1 border border-border-dark">
              <button className="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold">Manual</button>
              <button className="px-3 py-1.5 rounded hover:bg-white/5 text-text-secondary hover:text-white text-xs font-bold transition-colors">Auto-Optimize</button>
            </div>
          </div>
          <div className="space-y-3">
            {/* Item 1 */}
            <div className="group flex items-center gap-4 bg-background-dark border border-border-dark hover:border-primary/50 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all">
              <span className="material-symbols-outlined text-text-secondary group-hover:text-white">drag_indicator</span>
              <div className="h-8 w-8 rounded bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-xs">1</div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold text-white">OpenAI (GPT-4o)</span>
                <span className="text-[10px] text-text-secondary">Primary Reasoning Engine</span>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-secondary">Latency</span>
                  <span className="text-xs font-mono text-green-400">240ms</span>
                </div>
                <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary">
                  <span className="inline-block h-3 w-3 transform rounded-full bg-white transition translate-x-5"></span>
                </div>
              </div>
            </div>
            {/* Item 2 */}
            <div className="group flex items-center gap-4 bg-background-dark border border-border-dark hover:border-primary/50 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all">
              <span className="material-symbols-outlined text-text-secondary group-hover:text-white">drag_indicator</span>
              <div className="h-8 w-8 rounded bg-border-dark text-text-secondary flex items-center justify-center font-bold text-xs">2</div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold text-white">DeepSeek V2</span>
                <span className="text-[10px] text-text-secondary">Fallback / Specialized Tasks</span>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-secondary">Latency</span>
                  <span className="text-xs font-mono text-yellow-400">890ms</span>
                </div>
                <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary">
                  <span className="inline-block h-3 w-3 transform rounded-full bg-white transition translate-x-5"></span>
                </div>
              </div>
            </div>
            {/* Item 3 */}
            <div className="group flex items-center gap-4 bg-background-dark border border-border-dark hover:border-primary/50 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all opacity-70">
              <span className="material-symbols-outlined text-text-secondary group-hover:text-white">drag_indicator</span>
              <div className="h-8 w-8 rounded bg-border-dark text-text-secondary flex items-center justify-center font-bold text-xs">3</div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold text-text-secondary">Local LLM (Llama 3)</span>
                <span className="text-[10px] text-text-secondary">Offline Failover</span>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-secondary">Status</span>
                  <span className="text-xs font-mono text-text-secondary">Offline</span>
                </div>
                <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-border-dark">
                  <span className="inline-block h-3 w-3 transform rounded-full bg-text-secondary transition translate-x-1"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  )
}
