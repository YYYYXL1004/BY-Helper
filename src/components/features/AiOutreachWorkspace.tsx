import { useMemo, useState } from 'react'
import { Bot, Search, Wand2 } from 'lucide-react'
import { Advisor, Institution } from '../../stores/appStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import AiOutreachAssistant from './AiOutreachAssistant'

interface AiOutreachWorkspaceProps {
  institutions: Institution[]
}

interface AdvisorRow {
  advisor: Advisor
  institution: Institution
}

export default function AiOutreachWorkspace({ institutions }: AiOutreachWorkspaceProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const allRows: AdvisorRow[] = institutions.flatMap((institution) =>
      (institution.advisors || []).map((advisor) => ({ advisor, institution }))
    )
    if (!normalizedQuery) return allRows
    return allRows.filter(({ advisor, institution }) =>
      [advisor.name, advisor.researchArea, advisor.email, institution.name, institution.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [institutions, query])

  const selectedRow = rows.find((row) => row.advisor.id === selectedAdvisorId)

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6" />AI 套磁助手</h2>
          <p className="text-sm text-muted-foreground">选择一个导师，添加公开 URL，生成导师画像和针对性套磁草稿。API 与任务提示词在设置页配置。</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索导师、院校、研究方向" />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">暂无导师。请先在院校中添加导师。</div>
        ) : (
          <div className="space-y-3">
            {rows.map(({ advisor, institution }) => (
              <div key={advisor.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{advisor.name}</h3>
                    <Badge variant="outline">{institution.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{advisor.researchArea}</p>
                  <p className="text-xs text-muted-foreground">{advisor.email}</p>
                </div>
                <Button onClick={() => setSelectedAdvisorId(advisor.id)}><Wand2 className="h-4 w-4 mr-1" />开始套磁</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRow && (
        <AiOutreachAssistant advisor={selectedRow.advisor} open={Boolean(selectedAdvisorId)} onOpenChange={(open) => { if (!open) setSelectedAdvisorId(null) }} />
      )}
    </div>
  )
}
