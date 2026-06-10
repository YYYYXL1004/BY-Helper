import { useMemo, useState } from 'react'
import { Bot, ExternalLink, GripVertical, Search, Users } from 'lucide-react'
import { Advisor, Institution, useStore } from '../../stores/appStore'
import { advisorStatusConfig } from '../../lib/constants'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import AiOutreachAssistant from './AiOutreachAssistant'

interface AdvisorOverviewProps {
  institutions: Institution[]
  onSelectInstitution: (id: string) => void
  onSelectAdvisor: (institutionId: string, advisorId: string) => void
}

interface AdvisorRow {
  advisor: Advisor
  institution: Institution
}

interface AdvisorGroup {
  institution: Institution
  rows: AdvisorRow[]
}

export default function AdvisorOverview({ institutions, onSelectInstitution, onSelectAdvisor }: AdvisorOverviewProps): JSX.Element {
  const reorderAdvisors = useStore((state) => state.reorderAdvisors)
  const [query, setQuery] = useState('')
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)
  const [sortingInstitutionId, setSortingInstitutionId] = useState<string | null>(null)
  const [draggedAdvisorId, setDraggedAdvisorId] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()

  const allRows = useMemo<AdvisorRow[]>(() => {
    return institutions.flatMap((institution) =>
      (institution.advisors || []).map((advisor) => ({ advisor, institution }))
    )
  }, [institutions])

  const groups = useMemo<AdvisorGroup[]>(() => {
    return institutions
      .map((institution) => {
        const rows = (institution.advisors || [])
          .map((advisor) => ({ advisor, institution }))
          .filter(({ advisor }) => {
            if (!normalizedQuery) return true
            const statusLabel = advisorStatusConfig[advisor.contactStatus]?.label || advisor.contactStatus
            const text = [
              advisor.name,
              advisor.title,
              advisor.researchArea,
              advisor.email,
              advisor.notes,
              statusLabel,
              institution.name,
              institution.department
            ].filter(Boolean).join(' ').toLowerCase()
            return text.includes(normalizedQuery)
          })

        return { institution, rows }
      })
      .filter((group) => group.rows.length > 0)
  }, [institutions, normalizedQuery])

  const selectedRow = allRows.find((row) => row.advisor.id === selectedAdvisorId)
  const canSort = !normalizedQuery

  const handleSortModeToggle = (institutionId: string): void => {
    setSortingInstitutionId((current) => current === institutionId ? null : institutionId)
    setDraggedAdvisorId(null)
  }

  const handleAdvisorDrop = async (institution: Institution, targetId: string | null): Promise<void> => {
    if (sortingInstitutionId !== institution.id || !draggedAdvisorId || !institution.advisors) return

    const currentIds = institution.advisors.map((advisor) => advisor.id)
    if (!currentIds.includes(draggedAdvisorId)) return

    const nextIds = currentIds.filter((id) => id !== draggedAdvisorId)
    const targetIndex = targetId ? nextIds.indexOf(targetId) : nextIds.length
    nextIds.splice(targetIndex >= 0 ? targetIndex : nextIds.length, 0, draggedAdvisorId)

    if (nextIds.join('|') === currentIds.join('|')) return
    await reorderAdvisors(nextIds)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6" />导师总览</h2>
            <p className="text-sm text-muted-foreground">集中查看所有院校下的导师，直接进入 AI 套磁流程。</p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索导师、院校、方向、邮箱" />
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">暂无匹配导师。</div>
        ) : (
          <div className="space-y-5">
            {groups.map(({ institution, rows }) => {
              const isSorting = sortingInstitutionId === institution.id
              const canReorderGroup = canSort && (institution.advisors?.length ?? 0) > 1

              return (
                <section key={institution.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{institution.name}</h3>
                      <p className="text-sm text-muted-foreground">{institution.department} · {rows.length} 位导师</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onSelectInstitution(institution.id)}>查看院校</Button>
                      {canReorderGroup && (
                        <Button size="sm" variant={isSorting ? 'default' : 'outline'} onClick={() => handleSortModeToggle(institution.id)}>
                          <GripVertical className="mr-1.5 h-4 w-4" />
                          {isSorting ? '完成排序' : '调整顺序'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                    onDragOver={isSorting ? (event) => event.preventDefault() : undefined}
                    onDrop={isSorting ? (event) => {
                      event.preventDefault()
                      void handleAdvisorDrop(institution, null)
                    } : undefined}
                  >
                    {rows.map(({ advisor }) => {
                      const status = advisorStatusConfig[advisor.contactStatus]
                      const statusLabel = status?.label || advisor.contactStatus

                      return (
                        <div
                          key={advisor.id}
                          onDragOver={isSorting ? (event) => event.preventDefault() : undefined}
                          onDrop={isSorting ? (event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            void handleAdvisorDrop(institution, advisor.id)
                          } : undefined}
                          className={`rounded-lg border bg-card p-4 transition-opacity ${draggedAdvisorId === advisor.id ? 'opacity-50' : ''}`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onSelectAdvisor(institution.id, advisor.id)}
                                  className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary hover:underline"
                                >
                                  {advisor.name}
                                </button>
                                <p className="text-sm text-muted-foreground">{advisor.title || '无职称'} · {institution.name}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                {isSorting && (
                                  <button
                                    type="button"
                                    aria-label="拖动排序"
                                    title="拖动排序"
                                    draggable
                                    onDragStart={(event) => {
                                      event.dataTransfer.effectAllowed = 'move'
                                      setDraggedAdvisorId(advisor.id)
                                    }}
                                    onDragEnd={() => setDraggedAdvisorId(null)}
                                    className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </button>
                                )}
                                <Badge variant="outline" className={status?.badge}>{statusLabel}</Badge>
                              </div>
                            </div>
                            <p className="text-sm"><span className="text-muted-foreground">研究方向：</span>{advisor.researchArea}</p>
                            <p className="text-sm"><span className="text-muted-foreground">邮箱：</span>{advisor.email}</p>
                            <div className="flex flex-wrap gap-2 border-t pt-2">
                              <Button size="sm" variant="outline" onClick={() => onSelectInstitution(institution.id)}>查看院校</Button>
                              {advisor.homepage && (
                                <Button size="sm" variant="outline" onClick={() => window.open(advisor.homepage || '', '_blank')}>
                                  <ExternalLink className="mr-1 h-4 w-4" />主页
                                </Button>
                              )}
                              <Button size="sm" onClick={() => setSelectedAdvisorId(advisor.id)}><Bot className="mr-1 h-4 w-4" />AI 套磁</Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>

      {selectedRow && (
        <AiOutreachAssistant advisor={selectedRow.advisor} open={Boolean(selectedAdvisorId)} onOpenChange={(open) => { if (!open) setSelectedAdvisorId(null) }} />
      )}
    </div>
  )
}
