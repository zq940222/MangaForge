import { Link } from 'react-router-dom';

export function Characters() {
  const characters = [
    { id: 1, name: "Akira", role: "Protagonist • Cyber-Ninja", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrItNl0npMy3DaTl90d4mECdPLvfWZH0e0VuHukD2Xhur28r3yYbcsdYeaCBJSJDDmEIbxFCx-vjUytUjwsFN0Kl9BPtzpbqYmE8lVdLoUefTVqs1CGwG9Roy0_g_pN9q98M3-I1109R25fhcK362mSHTAoy5qSl0U99EH6ks7pX9hTZAWr6EtdkS5YrhcKC5jYWV5quEkwWBibyv9JwkLafUREIFp4BZkTMDYy2dZaLrCEcm3xuz3irAgtV38sESM6WYwzua4JHUF", status: "READY" },
    { id: 2, name: "Mecha-Unit 7", role: "Support • Heavy Assault", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYlW2SGeTy9r-9AsJILBIfiw1MfGLRyOB43UY99ctej-wgr_NT4JIMe4bl6oSqjzzFF0776tKNLpRtLkxJSTxyGJUcpOrTsCbOudX2ICwHb5p-m95wlPXQA27-l9Du5kfTp3---0wvZwUDYSjyh2ih5-C9yLtZ_5qf7c7M1BAW_7ytpJikSYoq1Tn1gpPzw0WFdJSlbGJXzYYTcd9fd9ix0m1cu9rCbjcCrrFmaa1hmexGcUIvSazWCZs7hiUQb-qMis8vql4RgxQc", status: "TRAINING", progress: 45 },
    { id: 3, name: "Luna", role: "Antagonist • Mage", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDST8XPn3V3tnxMCE3Mb5jPkMdSIX0Hj6t7Y8Fo9WBksg3PW1LBvsSY_Xn_1Tn-WwLfyfjZldz7PoYcGGHxw8M4jr6xfbTFf4NZI8d32ukkTMttE4L1GJZ6ncj5NUFpdU0d0JqKsxAr-X8LqBlOpOw9cWbbEk6xBhvktfrn-BaI_hYm-Royqc6PoiqkR3zzlsUZQ_BYbe_NBTKz_H1R7J0VvM7EWWam9z2pHt85MSm67-3qvRGG215aNZc7zlGqzlpv1e4n6RvoQk_-", status: "MISSING_VOICE" },
    { id: 4, name: "Kenji", role: "Side Character • Villager", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmj5w0Huvx9jOo0YkRba9IwQiI_4HqmMUC3eeNPY96GZQBsAlvOhGiTpiNggMQ1GhoYSOnG4aEr9LiQ40TrYnojKTcyiqC5o3SOp4Ni6Xcg1jjq115psVWIXGx10svxgpivLSezWWXs6881Vqz1H5LSVtHZol8SpPKzbZBeAuZAJV_rJsxJ0-uD9obWDXq9NMAEKalFY8COfOvDDY5AGWsosHHtcNmi8Y8H5-jX6TX9Jys023hLoZi0VA3Il5R1gOds21FHKjRZrlL", status: "DRAFT" },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      {/* Page Heading & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-white text-4xl font-bold tracking-tight">Character Library</h1>
          <p className="text-[#9da6b9] text-base max-w-2xl">Manage your cast, train LoRA models for visual consistency, and configure voice agents.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#282e39] text-white text-sm font-bold hover:bg-[#323945] transition-colors border border-transparent hover:border-gray-600">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            <span>Train New Model</span>
          </button>
          <button className="flex items-center gap-2 px-5 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Character</span>
          </button>
        </div>
      </div>

      {/* Filters & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-dark/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9da6b9]">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-[#111318] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm" placeholder="Search characters by name, role..." type="text"/>
        </div>
        {/* Filter Chips */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button className="flex items-center px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium whitespace-nowrap transition-colors">
            All Characters
          </button>
          <button className="flex items-center px-4 py-1.5 rounded-full bg-[#282e39] text-[#9da6b9] border border-transparent hover:border-gray-600 hover:text-white text-sm font-medium whitespace-nowrap transition-colors">
            LoRA Ready
          </button>
          <button className="flex items-center px-4 py-1.5 rounded-full bg-[#282e39] text-[#9da6b9] border border-transparent hover:border-gray-600 hover:text-white text-sm font-medium whitespace-nowrap transition-colors">
            Training (1)
          </button>
          <button className="flex items-center px-4 py-1.5 rounded-full bg-[#282e39] text-[#9da6b9] border border-transparent hover:border-gray-600 hover:text-white text-sm font-medium whitespace-nowrap transition-colors">
            Voice Missing
          </button>
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {characters.map((char) => (
          <div key={char.id} className="group relative flex flex-col bg-surface-dark rounded-xl overflow-hidden border border-[#282e39] hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            {/* Image Gallery Area */}
            <div className="relative aspect-[3/4] w-full bg-gray-900 group">
              {char.status === 'TRAINING' && (
                  <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-yellow-400 font-bold tracking-wider uppercase text-sm">Training LoRA</span>
                    <span className="text-white text-xs mt-1">Step 450/1000 ({char.progress}%)</span>
                  </div>
              )}
               {char.status === 'DRAFT' ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <img className="absolute w-full h-full object-cover opacity-30 grayscale" src={char.image} />
                       <div className="z-10 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-white text-[32px] opacity-50">image</span>
                        <span className="text-xs text-gray-400">Generating Reference...</span>
                       </div>
                   </div>
               ) : (
                   <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={char.image} alt={char.name} />
               )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-90"></div>
              
              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {char.status === 'READY' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> LoRA Ready
                    </span>
                )}
                 {char.status === 'DRAFT' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-700/50 text-gray-300 border border-gray-600/30 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Draft
                    </span>
                 )}
              </div>
            </div>
            {/* Info Content */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white text-xl font-bold font-display">{char.name}</h3>
                  <p className="text-[#9da6b9] text-sm">{char.role}</p>
                </div>
                <button className="text-gray-500 hover:text-white">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              
               {char.status === 'TRAINING' && (
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${char.progress}%` }}></div>
                  </div>
              )}

              {/* Voice Status */}
              {char.status === 'MISSING_VOICE' ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-[18px]">mic_off</span>
                    <div className="flex flex-col">
                        <span className="text-xs text-red-100 font-medium">Voice Missing</span>
                        <span className="text-[10px] text-red-300">Upload required</span>
                    </div>
                    </div>
                    <span className="material-symbols-outlined text-red-400 text-[16px]">upload</span>
                </div>
              ) : char.status === 'TRAINING' || char.status === 'DRAFT' ? (
                 <div className="flex items-center gap-2 p-2 rounded bg-[#111318] border border-gray-800 opacity-50">
                    <span className="material-symbols-outlined text-gray-500 text-[18px]">mic_off</span>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium">No Voice Data</span>
                    </div>
                 </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded bg-[#111318] border border-gray-800">
                    <span className="material-symbols-outlined text-primary text-[18px]">graphic_eq</span>
                    <div className="flex flex-col">
                    <span className="text-xs text-white font-medium">Voice Model Ready</span>
                    <span className="text-[10px] text-gray-500">3 samples uploaded</span>
                    </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#282e39] text-white text-sm font-medium hover:bg-[#323945] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">movie</span> Generate
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add New Placeholder Card */}
        <button className="group flex flex-col items-center justify-center bg-[#151a23] rounded-xl border-2 border-dashed border-[#282e39] hover:border-primary/50 hover:bg-[#1a202c] transition-all duration-300 min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-[#282e39] group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-[32px]">add</span>
          </div>
          <h3 className="text-white text-lg font-bold">Add New Character</h3>
          <p className="text-[#9da6b9] text-sm mt-1">Create from scratch or template</p>
        </button>
      </div>
    </div>
    </div>
  )
}
