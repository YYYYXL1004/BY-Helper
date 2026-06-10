/**
 * @Project: PG-Tracker
 * @File: App.tsx
 * @Description: 应用根组件，根据当前视图路由渲染对应页面，集成主题和布局
 * @Author: 杨敬诚
 * @Date: 2026-04-08
 * Copyright (c) 2026. All rights reserved.
 */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useStore } from './stores/appStore'
import ThemeProvider from './components/ThemeProvider'
import { ColorThemeProvider } from './components/ColorThemeContext'
import Sidebar from './components/layout/Sidebar'
import KanbanBoard from './components/features/KanbanBoard'
import InstitutionDetail from './components/features/InstitutionDetail'
import Timeline from './components/features/Timeline'
import Settings from './components/features/Settings'
import Dashboard from './components/features/Dashboard'
import UpdateNotification from './components/features/UpdateNotification'
import AdvisorOverview from './components/features/AdvisorOverview'
import AiOutreachWorkspace from './components/features/AiOutreachWorkspace'

function App(): JSX.Element {
  const { currentView, selectedInstitutionId, setView, setSelectedInstitutionId, loadInstitutions, institutions, isLoading } = useStore()
  const [targetAdvisorId, setTargetAdvisorId] = useState<string | null>(null)

  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  const handleSelectInstitution = (id: string | null): void => {
    setTargetAdvisorId(null)
    setSelectedInstitutionId(id)
    if (id) setView('kanban')
  }

  const handleSelectAdvisor = (institutionId: string, advisorId: string): void => {
    setTargetAdvisorId(advisorId)
    setSelectedInstitutionId(institutionId)
    setView('kanban')
  }

  const handleBackToKanban = (): void => {
    setTargetAdvisorId(null)
    setSelectedInstitutionId(null)
    setView('kanban')
  }

  const renderContent = (): JSX.Element => {
    // 显示加载状态
    if (isLoading && institutions.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      )
    }

    if (selectedInstitutionId) {
      const exists = institutions.some((i) => i.id === selectedInstitutionId)
      if (exists) {
        return (
          <InstitutionDetail
            institutionId={selectedInstitutionId}
            onBack={handleBackToKanban}
            targetAdvisorId={targetAdvisorId}
            onTargetAdvisorHandled={() => setTargetAdvisorId(null)}
          />
        )
      }
      // institution not loaded yet, show kanban
      return <KanbanBoard onSelectInstitution={handleSelectInstitution} />
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'timeline':
        return <Timeline institutions={institutions} />
      case 'advisors':
        return <AdvisorOverview institutions={institutions} onSelectInstitution={handleSelectInstitution} onSelectAdvisor={handleSelectAdvisor} />
      case 'aiOutreach':
        return <AiOutreachWorkspace institutions={institutions} />
      case 'settings':
        return <Settings />
      case 'kanban':
      default:
        return <KanbanBoard onSelectInstitution={handleSelectInstitution} />
    }
  }

  return (
    <ThemeProvider>
      <ColorThemeProvider>
        <div className="flex h-screen bg-background">
          <Sidebar
            currentView={currentView}
            onViewChange={setView}
            onSelectInstitution={handleSelectInstitution}
          />
          <main className="flex-1 overflow-hidden flex flex-col">
            <UpdateNotification />
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </main>
        </div>
      </ColorThemeProvider>
    </ThemeProvider>
  )
}

export default App
