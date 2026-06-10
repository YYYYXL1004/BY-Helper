import { useMemo, useState } from 'react'
import { Bot, Copy, ExternalLink, Plus, Trash2, Wand2, CheckCircle2 } from 'lucide-react'
import { Advisor, useStore } from '../../stores/appStore'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'

interface AiOutreachAssistantProps {
  advisor: Advisor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AiOutreachAssistant({ advisor, open, onOpenChange }: AiOutreachAssistantProps): JSX.Element {
  const {
    addAdvisorSource,
    deleteAdvisorSource,
    generateAdvisorInsight,
    generateEmailDraft,
    markEmailDraftSent
  } = useStore()
  const [url, setUrl] = useState(advisor.homepage || '')
  const [sourceEmail, setSourceEmail] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const latestDraft = advisor.emailDrafts?.[0]
  const readySourceCount = useMemo(() => (advisor.sources || []).filter((source) => source.status === 'READY').length, [advisor.sources])

  const handleAddUrl = async (): Promise<void> => {
    const nextUrl = url.trim()
    if (!nextUrl) return
    setBusy('source')
    setMessage(null)
    try {
      await addAdvisorSource(advisor.id, nextUrl)
      setUrl('')
      setMessage('资料读取完成')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(null)
    }
  }

  const handleGenerateInsight = async (): Promise<void> => {
    setBusy('insight')
    setMessage(null)
    try {
      await generateAdvisorInsight(advisor.id)
      setMessage('导师画像已生成')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(null)
    }
  }

  const handleGenerateDraft = async (): Promise<void> => {
    const trimmedSourceEmail = sourceEmail.trim()
    if (!trimmedSourceEmail) {
      setMessage('请先粘贴一封已有套磁信')
      return
    }
    setBusy('draft')
    setMessage(null)
    try {
      await generateEmailDraft({ advisorId: advisor.id, sourceEmail: trimmedSourceEmail })
      setMessage('套磁草稿已生成')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(null)
    }
  }

  const handleCopyDraft = async (): Promise<void> => {
    if (!latestDraft) return
    await navigator.clipboard.writeText(`主题：${latestDraft.subject}\n\n${latestDraft.content}`)
    setMessage('草稿已复制到剪贴板')
  }

  const handleMarkSent = async (): Promise<void> => {
    if (!latestDraft) return
    setBusy('sent')
    setMessage(null)
    try {
      await markEmailDraftSent(latestDraft.id)
      setMessage('已标记发送，并写入联系记录')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(null)
    }
  }

  const handleOpen = (nextOpen: boolean): void => {
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI 套磁助手 - {advisor.name}</DialogTitle>
          <DialogDescription>添加导师相关 URL，生成导师画像，再粘贴已有套磁信让 AI 针对当前导师重写。</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
          <div className="space-y-4">
            <section className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">1. 导师资料箱</h3>
                <Badge variant="outline">{readySourceCount} 个可用来源</Badge>
              </div>
              <div className="flex gap-2">
                <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="粘贴导师主页、学院页、DBLP、Semantic Scholar、arXiv URL" />
                <Button onClick={handleAddUrl} disabled={busy === 'source'}><Plus className="h-4 w-4 mr-1" />读取</Button>
              </div>
              <div className="space-y-2">
                {(advisor.sources || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无资料。建议先添加导师主页或论文列表页。</p>
                ) : advisor.sources?.map((source) => (
                  <div key={source.id} className="rounded-md border bg-muted/20 p-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={source.status === 'READY' ? 'default' : 'destructive'}>{source.sourceType}</Badge>
                          <a href={source.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline inline-flex items-center gap-1">
                            {source.title || source.url}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                        {source.error && <p className="text-xs text-destructive mt-1">{source.error}</p>}
                        {source.contentText && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.contentText.slice(0, 180)}</p>}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => { void deleteAdvisorSource(source.id) }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">2. 导师画像</h3>
                <Button onClick={handleGenerateInsight} disabled={busy === 'insight' || readySourceCount === 0} size="sm">
                  <Wand2 className="h-4 w-4 mr-1" />生成画像
                </Button>
              </div>
              {advisor.insight ? (
                <div className="space-y-3 text-sm">
                  <InfoBlock title="研究概况" value={advisor.insight.researchSummary} />
                  <InfoBlock title="近期关键词" value={advisor.insight.recentKeywords} />
                  <InfoBlock title="代表成果" value={advisor.insight.representativeWorks} />
                  <InfoBlock title="套磁切入点" value={advisor.insight.emailHooks} />
                  <InfoBlock title="注意事项" value={advisor.insight.cautions} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">添加资料后生成导师画像。AI 只会基于你提供的 URL 内容分析。</p>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold">3. 生成套磁草稿</h3>
              <div>
                <Label>原始套磁信</Label>
                <Textarea
                  value={sourceEmail}
                  onChange={(event) => setSourceEmail(event.target.value)}
                  rows={10}
                  placeholder="粘贴你目前使用的一封套磁信，AI 会保留其中真实背景和基本语气，并结合导师画像重写。"
                  className="text-sm leading-6"
                />
              </div>
              <Button onClick={handleGenerateDraft} disabled={busy === 'draft'} className="w-full"><Wand2 className="h-4 w-4 mr-1" />生成草稿</Button>
              <p className="text-xs text-muted-foreground">建议先生成导师画像。AI 会把粘贴的原信作为事实基础，草稿不会自动发送。</p>
            </section>

            <section className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">4. 最新草稿</h3>
                {latestDraft && <Badge variant={latestDraft.status === 'SENT' ? 'default' : 'outline'}>{latestDraft.status}</Badge>}
              </div>
              {latestDraft ? (
                <div className="space-y-3">
                  <div>
                    <Label>主题</Label>
                    <Input value={latestDraft.subject} readOnly />
                  </div>
                  <div>
                    <Label>正文</Label>
                    <Textarea value={latestDraft.content} readOnly rows={12} className="text-sm leading-6" />
                  </div>
                  {latestDraft.rationale && <InfoBlock title="生成理由" value={latestDraft.rationale} />}
                  {latestDraft.checklist && <InfoBlock title="发送前检查" value={latestDraft.checklist} />}
                  <div className="flex gap-2">
                    <Button onClick={handleCopyDraft} variant="outline" className="flex-1"><Copy className="h-4 w-4 mr-1" />复制</Button>
                    <Button onClick={handleMarkSent} disabled={busy === 'sent' || latestDraft.status === 'SENT'} className="flex-1"><CheckCircle2 className="h-4 w-4 mr-1" />标记已发送</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无草稿。生成后可以复制到邮箱，人工确认后再发送。</p>
              )}
            </section>
          </div>
        </div>

        {message && <p className="rounded-md border bg-muted/40 p-2 text-sm">{message}</p>}
      </DialogContent>
    </Dialog>
  )
}

function InfoBlock({ title, value }: { title: string; value: string | null | undefined }): JSX.Element {
  if (!value) return <div className="text-sm text-muted-foreground">{title}：暂无</div>
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <p className="whitespace-pre-wrap rounded-md bg-muted/30 p-2 text-sm leading-6">{value}</p>
    </div>
  )
}
