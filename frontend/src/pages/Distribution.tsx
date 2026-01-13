export function Distribution() {
  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Top Header (Page specific) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-text-secondary text-xs font-medium uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Project
          </div>
          <h2 className="text-white text-3xl font-bold leading-tight">Publish & Distribution</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-surface-dark hover:bg-border-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border-dark flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">history</span>
            History
          </button>
        </div>
      </div>

      {/* Headline Context */}
      <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="flex gap-5 items-center">
          <div className="bg-center bg-no-repeat w-32 h-20 rounded-lg bg-cover shadow-md border border-white/10 relative overflow-hidden group" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmQEnij9ZO1h3QqvjmZHq3w6WnqB3g_di_Yo7U1Ib5T2Rn-hVLj4wpMv5xEYLYNrRZTgN04Y1sPILL6wzgGXVzDRWMtgJ0Fefj8IFzB5wBjDd1S7imbSolq2tRPTeCs7-uZJEyC0EvlXj6z2t2VTuNkVg6AxHEeKpRTA7lzYbwiHhj_PZepLvyI7mk8_NsLKISR0lJvR5Oj56AIcRAkhf3sLwWPaj4jscEGJIYyrao5B4-Vjg34xcpS88vE6xERRDDGH3CicymzGpQ")' }}>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white">play_circle</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-text-secondary text-sm font-medium">Ready for distribution</p>
            <h3 className="text-white text-2xl font-bold tracking-tight">Episode 12 - The Neon Samurai</h3>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">4K</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">60 FPS</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">EN/CN Subs</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-border-dark hover:bg-white/5 text-white text-sm font-medium transition-colors">Preview Video</button>
          <button className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-border-dark hover:bg-white/5 text-white text-sm font-medium transition-colors">Edit Metadata</button>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Card 1: Douyin (Connected) */}
        <div className="bg-surface-dark border border-primary/30 rounded-xl p-5 shadow-[0_0_15px_rgba(19,91,236,0.05)] flex flex-col gap-5 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 p-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-black flex items-center justify-center p-1 border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl">music_note</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Douyin (TikTok CN)</h4>
              <p className="text-emerald-400 text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Connected as @MangaCreator
              </p>
            </div>
          </div>
          <div className="h-px bg-white/5 w-full"></div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between cursor-pointer group/toggle">
              <div className="flex items-center gap-2 text-slate-300 group-hover/toggle:text-white transition-colors text-sm">
                <span className="material-symbols-outlined text-lg text-slate-500">tag</span>
                Auto-add Hashtags
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer group/toggle">
              <div className="flex items-center gap-2 text-slate-300 group-hover/toggle:text-white transition-colors text-sm">
                <span className="material-symbols-outlined text-lg text-slate-500">subtitles</span>
                Sync Subtitles
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>
          <div className="mt-auto pt-2">
            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-transparent hover:border-white/10">Manage Configuration</button>
          </div>
        </div>

        {/* Card 2: Bilibili (Expired) */}
        <div className="bg-surface-dark border border-amber-500/30 rounded-xl p-5 shadow-[0_0_15px_rgba(245,158,11,0.05)] flex flex-col gap-5 relative overflow-hidden hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-3">
            <span className="flex h-3 w-3 relative">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-[#23ade5] flex items-center justify-center p-1 border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl">smart_display</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Bilibili</h4>
              <p className="text-amber-500 text-sm flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-sm">warning</span>
                Token Expired
              </p>
            </div>
          </div>
          <div className="h-px bg-white/5 w-full"></div>
          <div className="flex flex-col gap-3 opacity-50 pointer-events-none grayscale">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="material-symbols-outlined text-lg text-slate-500">tag</span>
                Auto-add Hashtags
              </div>
              <div className="w-11 h-6 bg-slate-700 rounded-full relative after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5"></div>
            </label>
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="material-symbols-outlined text-lg text-slate-500">schedule</span>
                Timed Release
              </div>
              <div className="w-11 h-6 bg-slate-700 rounded-full relative after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5"></div>
            </label>
          </div>
          <div className="mt-auto pt-2">
            <button className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors shadow-lg shadow-amber-500/20">Refresh Token</button>
          </div>
        </div>

        {/* Card 3: Kuaishou (Not Linked) */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col gap-5 relative overflow-hidden group hover:border-slate-500 transition-colors">
          <div className="absolute top-0 right-0 p-3">
            <span className="flex h-3 w-3 relative">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-700"></span>
            </span>
          </div>
          <div className="flex items-center gap-4 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
            <div className="size-14 rounded-xl bg-[#FF4C00] flex items-center justify-center p-1 border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl">video_camera_back</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Kuaishou</h4>
              <p className="text-slate-500 text-sm flex items-center gap-1">
                Not Linked
              </p>
            </div>
          </div>
          <div className="h-px bg-white/5 w-full"></div>
          <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
            <span className="material-symbols-outlined text-4xl text-slate-700">link_off</span>
            <p className="text-slate-500 text-sm">Connect account to enable publishing</p>
          </div>
          <div className="mt-auto pt-2">
            <button className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">add_link</span>
              Authorize
            </button>
          </div>
        </div>

        {/* Card 4: WeChat Channels (Connected) */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 flex flex-col gap-5 relative overflow-hidden group hover:border-slate-500 transition-colors">
          <div className="absolute top-0 right-0 p-3">
            <span className="flex h-3 w-3 relative">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-[#07C160] flex items-center justify-center p-1 border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl">chat_bubble</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">WeChat Channels</h4>
              <p className="text-emerald-400 text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Connected as @DailyManga
              </p>
            </div>
          </div>
          <div className="h-px bg-white/5 w-full"></div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between cursor-pointer group/toggle">
              <div className="flex items-center gap-2 text-slate-300 group-hover/toggle:text-white transition-colors text-sm">
                <span className="material-symbols-outlined text-lg text-slate-500">tag</span>
                Auto-add Hashtags
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer group/toggle">
              <div className="flex items-center gap-2 text-slate-300 group-hover/toggle:text-white transition-colors text-sm">
                <span className="material-symbols-outlined text-lg text-slate-500">schedule</span>
                Timed Release
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>
          <div className="mt-auto pt-2">
            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-transparent hover:border-white/10">Manage Configuration</button>
          </div>
        </div>
      </div>

      {/* Sticky Footer Action */}
      <div className="sticky bottom-0 border-t border-border-dark bg-[#111318]/95 backdrop-blur-xl p-4 w-full z-30 -mx-6 -mb-8 md:-mx-8 md:-mb-8 mt-auto rounded-t-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-8">
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
            <span className="hidden md:inline">Ready to publish to 2 platforms. 1 Platform needs attention.</span>
            <span className="md:hidden">2 Ready. 1 Error.</span>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex-1 md:flex-none">Save Draft</button>
            <button className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(19,91,236,0.4)] hover:shadow-[0_0_25px_rgba(19,91,236,0.6)] transition-all flex items-center justify-center gap-2 flex-1 md:flex-none transform hover:-translate-y-0.5">
              <span className="material-symbols-outlined">rocket_launch</span>
              Batch Publish Current Episode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}