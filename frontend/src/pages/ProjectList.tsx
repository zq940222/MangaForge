import { Link } from 'react-router-dom';

export function ProjectList() {
  const projects = [
    { id: 1, title: "Cyberpunk Samurai Ep.1", status: "DONE", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSbtyBBOox00K5l2Zgq0QOLh85mI_e0sgzcjlvFeiEOQbLCGEMJyFzEz88WZsNIZrVQLimXJ-36Qu2MzOU1Zmr9XIQF-7_GqQ4Y9iiNTucO6MDyegYAPgFtGdsArhek4amFOB24aTZhvhmICDtzXT_gKn2sjtVUpzJIJ4YSwhPd3YrM2a3svJpowkmGxsn-aF6yntGXQqu47Nm3MYiccl_ztp243VUnO6PUSwbqUXk3RUGepw1fV4_1iZSo_F1Q6uhD-UwUAeYWfqx", time: "Edited 2h ago" },
    { id: 2, title: "High School Romance Promo", status: "GENERATING", progress: 60, time: "Rendering..." },
    { id: 3, title: "Mecha Battle Short", status: "DRAFT", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQOCcWygjPkX26V44g7VusRGBemi6mF2UW2JML9UKgDvrNAzi5bcwiMKs3BfgCtijPHgVsaMvhq2zeQM37mS425xj3idDXoqP-54HI4iuoY-aCE3_M1Jtfrd0U57Z3vUdXRUPloB6Eb3tsZ3nUf3Ss3MEGBv3NSugtJ9Lwg2sb7PirYFZAbbqb_aGmnKfZ1rOEf8RPQuMluE97--DZ5kaXxA2EYWYdYnJvl5GQV1EMWh08GP60XBaTJf3hEtB8NiCLxbCK-TiKczqd", time: "Edited yesterday" },
    { id: 4, title: "Fantasy World Intro", status: "QUEUED", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDW3Ux6HZEkhZY8jdJSmwjbUR7TOm9TXsO87LeKavCtykLt__MRGGN4txspUAFZ5LtZHr1v3NPuk_35tiB-QezisArDwng8FJA0OSPuObHnuy4drszYuuFcq5E0DZw73-LUO4_pMRoWO4BO9hdT9Kf6_CKzoQx6UiGV9lZvxXCiIojyUOgZ19TqIOUi7j9KOvZY5kHKnY0U1_av5xcFz99hIU-oZ15Bfl3EepcXfrlD5CHzCVe0Sc0N2Rt5S81rdP2VddYNc24orgAO", time: "Waiting for agent..." },
    { id: 5, title: "Space Opera", status: "DRAFT", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQvaBgyu0utfp6-7Lz6TOUhlrXEoylCV_4O9FOVg5MO5PL_XGiIRYdnbPCyPrpaMaIu80-Vo2L90FTiCOep9VlQsXSbihuNLC4BHHPFj-x2nuhAMMhI3MJk6SwvDk5-nkEZfGkd7pT2vn6po4d7eziR0cjZAZOqaPA5SQTuPlRKbQ-hSXMA5TpEWNiAK9RhwBrfsvtd_Jq6gExkbDZdZKrz_Oh3N4ciuBp01UyMiDN1iq1-SdivcMbrEoBIpuRoLYXfG5OoWmoOEvA", time: "Edited 3 days ago" },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">My Projects</h1>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors">Filter</button>
            <button className="px-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium hover:bg-border-dark transition-colors">Sort</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {projects.map((project) => (
          <Link to={`/projects/${project.id}`} key={project.id}>
             {project.status === 'GENERATING' ? (
                <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-primary/40 shadow-[0_0_15px_rgba(19,91,236,0.1)] transition-all cursor-pointer h-full">
                <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 border border-primary/20">
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f1115] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent animate-pulse"></div>
                    <div className="loader mb-3"></div>
                    <p className="text-primary text-xs font-medium animate-pulse">Rendering...</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>
                    {project.progress}%
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                  <h3 className="text-white text-sm font-bold truncate">{project.title}</h3>
                  <div className="w-full bg-[#2d3340] h-1 rounded-full mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
             ) : (
                <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 border border-border-dark hover:border-primary/50 transition-all cursor-pointer h-full">
                <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
                    <img alt={project.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${project.status === 'DRAFT' ? 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100' : ''}`} src={project.image} />
                    
                    {project.status === 'DONE' && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        DONE
                        </div>
                    )}
                    {project.status === 'DRAFT' && (
                        <div className="absolute top-2 right-2 bg-gray-700/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                            DRAFT
                        </div>
                    )}
                    {project.status === 'QUEUED' && (
                        <div className="absolute top-2 right-2 bg-amber-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">hourglass_empty</span>
                            QUEUED
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-white text-black rounded-full hover:bg-gray-200">
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    </button>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                    <h3 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-text-secondary text-xs">{project.time}</p>
                </div>
                </div>
             )}
          </Link>
        ))}
        
        {/* Create New Card */}
        <button className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-[#151a23] border-2 border-dashed border-border-dark hover:border-primary/50 hover:bg-surface-dark transition-all cursor-pointer h-full min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-surface-dark group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-text-secondary group-hover:text-primary text-3xl">add</span>
            </div>
            <span className="text-sm font-bold text-text-secondary group-hover:text-white">Create New Project</span>
        </button>
      </div>
    </div>
    </div>
  )
}
