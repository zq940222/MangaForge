import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { ProjectList } from './pages/ProjectList'
import { ProjectDetail } from './pages/ProjectDetail'
import { Settings } from './pages/Settings'
import { Generation } from './pages/Generation'
import { Characters } from './pages/Characters'
import { AssetLibrary } from './pages/AssetLibrary'
import { Distribution } from './pages/Distribution'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          {/* We mapped the Editor Workspace to Generation page */}
          <Route path="projects/:projectId/generate/:episodeId" element={<Generation />} />
          <Route path="characters" element={<Characters />} />
          <Route path="library" element={<AssetLibrary />} />
          <Route path="settings" element={<Settings />} />
          <Route path="distribution" element={<Distribution />} />
          <Route path="analytics" element={<div className="p-8 text-white">Analytics Placeholder</div>} />
          <Route path="billing" element={<div className="p-8 text-white">Billing Placeholder</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App