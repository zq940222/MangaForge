export function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Welcome back, Elena</h1>
        <p className="text-text-secondary">Your AI agents are ready. You have 450 credits remaining for this cycle.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-surface-dark hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-text-secondary text-sm font-medium">Total Generated</p>
            <span className="material-symbols-outlined text-primary/70">video_library</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-white text-3xl font-bold tracking-tight">128</p>
            <p className="text-emerald-500 text-sm font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-base">trending_up</span> +12%
            </p>
          </div>
          <p className="text-text-secondary text-xs mt-1">Videos created this month</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-surface-dark hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-text-secondary text-sm font-medium">Credits Usage</p>
            <span className="material-symbols-outlined text-primary/70">bolt</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-white text-3xl font-bold tracking-tight">450</p>
            <span className="text-text-secondary text-sm">/ 1000</span>
          </div>
          <div className="w-full bg-[#2d3340] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-border-dark bg-surface-dark hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-text-secondary text-sm font-medium">Avg Render Time</p>
            <span className="material-symbols-outlined text-primary/70">timer</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-white text-3xl font-bold tracking-tight">1m 45s</p>
            <p className="text-emerald-500 text-sm font-medium">-5s vs last week</p>
          </div>
          <p className="text-text-secondary text-xs mt-1">Optimization active</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Recent Projects */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Recent Projects</h2>
            <button className="text-sm text-primary font-medium hover:text-white transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Project Card 1: Completed */}
            <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-border-dark hover:border-primary/50 transition-all cursor-pointer">
              <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
                <img alt="Cyberpunk manga" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSbtyBBOox00K5l2Zgq0QOLh85mI_e0sgzcjlvFeiEOQbLCGEMJyFzEz88WZsNIZrVQLimXJ-36Qu2MzOU1Zmr9XIQF-7_GqQ4Y9iiNTucO6MDyegYAPgFtGdsArhek4amFOB24aTZhvhmICDtzXT_gKn2sjtVUpzJIJ4YSwhPd3YrM2a3svJpowkmGxsn-aF6yntGXQqu47Nm3MYiccl_ztp243VUnO6PUSwbqUXk3RUGepw1fV4_1iZSo_F1Q6uhD-UwUAeYWfqx" />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  DONE
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-white text-black rounded-full hover:bg-gray-200">
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 px-1">
                <h3 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">Cyberpunk Samurai Ep.1</h3>
                <p className="text-text-secondary text-xs">Edited 2h ago</p>
              </div>
            </div>

            {/* Project Card 2: Generating */}
            <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-primary/40 shadow-[0_0_15px_rgba(19,91,236,0.1)] transition-all cursor-pointer">
              <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 border border-primary/20">
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f1115] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse"></div>
                  <div className="loader mb-3"></div>
                  <p className="text-primary text-xs font-medium animate-pulse">Rendering...</p>
                </div>
                <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
                  60%
                </div>
              </div>
              <div className="flex flex-col gap-0.5 px-1">
                <h3 className="text-white text-sm font-bold truncate">High School Romance Promo</h3>
                <div className="w-full bg-[#2d3340] h-1 rounded-full mt-1">
                  <div className="bg-primary h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

             {/* Project Card 3: Draft */}
             <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-border-dark hover:border-primary/50 transition-all cursor-pointer">
                <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
                    <img alt="Abstract neon swirl pattern" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQOCcWygjPkX26V44g7VusRGBemi6mF2UW2JML9UKgDvrNAzi5bcwiMKs3BfgCtijPHgVsaMvhq2zeQM37mS425xj3idDXoqP-54HI4iuoY-aCE3_M1Jtfrd0U57Z3vUdXRUPloB6Eb3tsZ3nUf3Ss3MEGBv3NSugtJ9Lwg2sb7PirYFZAbbqb_aGmnKfZ1rOEf8RPQuMluE97--DZ5kaXxA2EYWYdYnJvl5GQV1EMWh08GP60XBaTJf3hEtB8NiCLxbCK-TiKczqd"/>
                    <div className="absolute top-2 right-2 bg-gray-700/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                        DRAFT
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">edit</span>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                    <h3 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">Mecha Battle Short</h3>
                    <p className="text-text-secondary text-xs">Edited yesterday</p>
                </div>
            </div>

            {/* Project Card 4: Queued */}
            <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-border-dark hover:border-primary/50 transition-all cursor-pointer">
                <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
                    <img alt="Dark anime aesthetic city street" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW3Ux6HZEkhZY8jdJSmwjbUR7TOm9TXsO87LeKavCtykLt__MRGGN4txspUAFZ5LtZHr1v3NPuk_35tiB-QezisArDwng8FJA0OSPuObHnuy4drszYuuFcq5E0DZw73-LUO4_pMRoWO4BO9hdT9Kf6_CKzoQx6UiGV9lZvxXCiIojyUOgZ19TqIOUi7j9KOvZY5kHKnY0U1_av5xcFz99hIU-oZ15Bfl3EepcXfrlD5CHzCVe0Sc0N2Rt5S81rdP2VddYNc24orgAO"/>
                    <div className="absolute top-2 right-2 bg-amber-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">hourglass_empty</span>
                        QUEUED
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                    <h3 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">Fantasy World Intro</h3>
                    <p className="text-text-secondary text-xs">Waiting for agent...</p>
                </div>
            </div>

          </div>
        </div>

        {/* System Status */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">System Status</h2>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-500 font-medium ml-1">Online</span>
            </div>
          </div>
          <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden flex flex-col">
            {/* Agent 1 */}
            <div className="p-4 border-b border-border-dark hover:bg-[#232730] transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined text-lg">description</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">ScriptWriter</p>
                    <p className="text-xs text-text-secondary">GPT-4 Turbo</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-[#282e39] text-xs text-white font-medium">Idle</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <p className="text-xs text-text-secondary w-8">Load</p>
                <div className="flex-1 h-1.5 bg-[#2d3340] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '12%' }}></div>
                </div>
                <p className="text-xs text-white font-medium w-8 text-right">12%</p>
              </div>
            </div>
            
            {/* Agent 2 */}
            <div className="p-4 border-b border-border-dark hover:bg-[#232730] transition-colors relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"></div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-lg">face</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">CharGen</p>
                            <p className="text-xs text-text-secondary">Stable Diffusion XL</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-primary/20 text-xs text-primary font-bold border border-primary/20">Active</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <p className="text-xs text-text-secondary w-8">Load</p>
                    <div className="flex-1 h-1.5 bg-[#2d3340] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full relative overflow-hidden" style={{ width: '45%' }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-xs text-white font-medium w-8 text-right">45%</p>
                </div>
                <p className="text-xs text-text-secondary mt-2 pl-11">Processing: "High School Ro..."</p>
            </div>

            {/* Agent 3 */}
            <div className="p-4 hover:bg-[#232730] transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <span className="material-symbols-outlined text-lg">movie</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">VideoRenderer</p>
                    <p className="text-xs text-text-secondary">Render Farm A</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-orange-500/10 text-xs text-orange-500 font-bold border border-orange-500/20">Heavy</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <p className="text-xs text-text-secondary w-8">Load</p>
                <div className="flex-1 h-1.5 bg-[#2d3340] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '88%' }}></div>
                </div>
                <p className="text-xs text-white font-medium w-8 text-right">88%</p>
              </div>
              <p className="text-xs text-text-secondary mt-2 pl-11">Queue depth: 5 jobs</p>
            </div>
          </div>
          
          {/* Notification Card */}
          <div className="bg-gradient-to-br from-[#1c1f27] to-[#161820] rounded-xl border border-border-dark p-4 mt-2">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">tips_and_updates</span>
              <div>
                <p className="text-sm font-bold text-white">New Model Available</p>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">MangaStyle V4 is now available for all Pro users. Better line art and color consistency.</p>
                <button className="text-xs text-primary font-bold mt-2 hover:underline">Read Changelog</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
