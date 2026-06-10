/**
 * @Project: PG-Tracker
 * @File: Settings.tsx
 * @Description: 设置页面，提供主题、颜色、数据管理、AI 配置、更新和关于信息
 * @Author: 杨敬诚
 * @Date: 2026-04-08
 * Copyright (c) 2026. All rights reserved.
 */
import { useEffect, useState } from 'react'
import { Bot, Check, Database, Download, Monitor, Moon, Palette, RefreshCw, Sun, Trash2, Upload } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { colorThemes, useColorTheme } from '../ColorThemeContext'
import { DEFAULT_AI_OUTREACH_SYSTEM_PROMPT } from '../../lib/aiOutreach'
import { getErrorMessage } from '../../lib/utils'
import { useAppVersion } from '../../lib/useAppVersion'
import { useUpdater } from '../../lib/useUpdater'
import { useStore } from '../../stores/appStore'

export default function Settings(): JSX.Element | null {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const { aiConfig, loadAiConfig, saveAiConfig, testAiConfig } = useStore()
  const [mounted, setMounted] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDoubleConfirm, setShowDoubleConfirm] = useState(false)
  const [aiForm, setAiForm] = useState({
    baseUrl: '',
    model: '',
    apiKey: '',
    systemPrompt: DEFAULT_AI_OUTREACH_SYSTEM_PROMPT
  })
  const [aiSaving, setAiSaving] = useState(false)
  const [aiTesting, setAiTesting] = useState(false)
  const appVersion = useAppVersion()
  const { status, checking, checkForUpdates, downloadUpdate, installUpdate } = useUpdater()

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    void loadAiConfig()
  }, [loadAiConfig])

  useEffect(() => {
    if (!aiConfig) return
    setAiForm({
      baseUrl: aiConfig.baseUrl || '',
      model: aiConfig.model || '',
      apiKey: '',
      systemPrompt: aiConfig.systemPrompt || DEFAULT_AI_OUTREACH_SYSTEM_PROMPT
    })
  }, [aiConfig])

  if (!mounted) return null

  const handleExportData = async (): Promise<void> => {
    try {
      const result = await window.api.backup.exportAll()
      if (!result.success) {
        alert('导出失败：' + (result.error || '未知错误'))
        return
      }
      const json = JSON.stringify(result.data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pg-tracker-full-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('导出失败：' + getErrorMessage(error))
    }
  }

  const handleImportData = async (): Promise<void> => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) return

        const readFile = (): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (readerEvent) => resolve(readerEvent.target?.result as string)
            reader.onerror = reject
            reader.readAsText(file)
          })
        }

        try {
          const content = await readFile()
          const data = JSON.parse(content)
          const payload = data.institutions !== undefined || data.orphanTasks !== undefined || data.emailTemplates !== undefined
            ? data
            : Array.isArray(data)
              ? { institutions: data }
              : {}
          const hasImportableData = Array.isArray(payload.institutions) || Array.isArray(payload.orphanTasks) || Array.isArray(payload.emailTemplates)
          if (!hasImportableData) {
            alert('导入失败：无效的数据格式')
            return
          }

          const shouldImport = window.confirm('导入会先清空当前数据，再恢复备份文件中的内容。建议确认已导出当前备份后再继续。是否继续？')
          if (!shouldImport) return

          const result = await window.api.backup.importAll(payload, { mode: 'replace' })
          if (!result.success) {
            alert('导入失败：' + (result.error || '无效的数据格式'))
            return
          }
          const { institutions: instCount, orphanTasks, emailTemplates: tplCount } = result.data || {}
          const parts = [`${instCount || 0} 所院校`]
          if (orphanTasks) parts.push(`${orphanTasks} 个独立任务`)
          if (tplCount) parts.push(`${tplCount} 个邮件模板`)
          alert(`导入成功！共导入 ${parts.join('、')}及关联的导师、文件、面经数据。`)
          window.location.reload()
        } catch {
          alert('导入失败：无效的数据文件')
        }
      }
      input.click()
    } catch (error) {
      console.error('Failed to import data:', error)
    }
  }

  const handleClearData = async (): Promise<void> => {
    try {
      const result = await window.api.backup.clearAll()
      if (!result.success) {
        alert('清除失败：' + (result.error || '未知错误'))
        return
      }
      alert('数据已清除')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('清除失败：' + getErrorMessage(error))
    }
  }

  const handleSaveAiConfig = async (): Promise<void> => {
    setAiSaving(true)
    try {
      await saveAiConfig({
        baseUrl: aiForm.baseUrl,
        model: aiForm.model,
        apiKey: aiForm.apiKey || undefined,
        systemPrompt: aiForm.systemPrompt
      })
      setAiForm((prev) => ({ ...prev, apiKey: '' }))
      alert('AI 配置已保存')
    } catch (error) {
      alert('AI 配置保存失败：' + getErrorMessage(error))
    } finally {
      setAiSaving(false)
    }
  }

  const handleTestAiConfig = async (): Promise<void> => {
    setAiTesting(true)
    try {
      await testAiConfig()
      alert('AI 连接测试成功')
    } catch (error) {
      alert('AI 连接测试失败：' + getErrorMessage(error))
    } finally {
      setAiTesting(false)
    }
  }

  const selectedColorTheme = colorThemes.find((color) => color.id === colorTheme)

  return (
    <div className="h-full overflow-auto p-6">
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={(open) => {
          setShowClearConfirm(open)
          if (!open) setShowDoubleConfirm(false)
        }}
        title="清除所有数据"
        description="确定要清除所有数据吗？此操作不可恢复！"
        confirmText="继续"
        variant="destructive"
        onConfirm={() => setShowDoubleConfirm(true)}
      />
      <ConfirmDialog
        open={showDoubleConfirm}
        onOpenChange={setShowDoubleConfirm}
        title="最终确认"
        description="这是最后一次确认，清除后所有数据将永久丢失！建议先导出备份。"
        confirmText="清除数据"
        variant="destructive"
        onConfirm={handleClearData}
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold">设置</h2>
          <p className="text-muted-foreground">管理应用偏好、数据和 AI 接口</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">外观模式</CardTitle>
            <CardDescription>选择浅色或深色显示模式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">显示模式</Label>
              <div className="flex gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="flex-1"><Sun className="h-4 w-4 mr-2" />浅色</Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="flex-1"><Moon className="h-4 w-4 mr-2" />深色</Button>
                <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="flex-1"><Monitor className="h-4 w-4 mr-2" />跟随系统</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><Palette className="h-5 w-5" />颜色主题</CardTitle>
            <CardDescription>选择你喜欢的颜色风格</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {colorThemes.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setColorTheme(color.id)}
                  className={`relative rounded-lg border-2 p-3 transition-all hover:scale-105 ${
                    colorTheme === color.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full shadow-md" style={{ backgroundColor: color.color }} />
                    <span className="text-xs font-medium">{color.name}</span>
                  </div>
                  {colorTheme === color.id && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              当前选择：<span className="font-medium">{selectedColorTheme?.name}</span>
              {selectedColorTheme ? ` - ${selectedColorTheme.description}` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><Database className="h-5 w-5" />数据管理</CardTitle>
            <CardDescription>导入、导出或清除你的数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData} className="flex-1"><Download className="h-4 w-4 mr-2" />导出数据</Button>
              <Button variant="outline" onClick={handleImportData} className="flex-1"><Upload className="h-4 w-4 mr-2" />导入数据</Button>
            </div>
            <div className="border-t pt-4">
              <Button variant="destructive" onClick={() => setShowClearConfirm(true)} className="w-full"><Trash2 className="h-4 w-4 mr-2" />清除所有数据</Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">清除后数据将永久丢失，请先导出备份</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5" />AI 配置</CardTitle>
            <CardDescription>配置 OpenAI-compatible 中转站、模型和套磁助手提示词</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>API Base URL</Label>
                <Input
                  value={aiForm.baseUrl}
                  onChange={(event) => setAiForm((prev) => ({ ...prev, baseUrl: event.target.value }))}
                  placeholder="https://your-relay.example.com/v1"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>模型名</Label>
                  <Input
                    value={aiForm.model}
                    onChange={(event) => setAiForm((prev) => ({ ...prev, model: event.target.value }))}
                    placeholder="gpt-5.5 / gpt-5.4-mini / ..."
                  />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={aiForm.apiKey}
                    onChange={(event) => setAiForm((prev) => ({ ...prev, apiKey: event.target.value }))}
                    placeholder={aiConfig?.apiKeyPreview ? `已保存：${aiConfig.apiKeyPreview}` : '输入中转站 API Key'}
                  />
                </div>
              </div>
              <div>
                <Label>任务初始提示词</Label>
                <Textarea
                  rows={8}
                  value={aiForm.systemPrompt}
                  onChange={(event) => setAiForm((prev) => ({ ...prev, systemPrompt: event.target.value }))}
                  placeholder={DEFAULT_AI_OUTREACH_SYSTEM_PROMPT}
                />
                <p className="mt-1 text-xs text-muted-foreground">用于约束导师画像和套磁草稿生成风格。建议保留事实可追溯、不编造、克制专业等要求。</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveAiConfig} disabled={aiSaving} className="flex-1">{aiSaving ? '保存中...' : '保存 AI 配置'}</Button>
                <Button onClick={handleTestAiConfig} disabled={aiTesting || !aiConfig} variant="outline" className="flex-1">{aiTesting ? '测试中...' : '测试连接'}</Button>
              </div>
              <p className="text-xs text-muted-foreground">API Key 只保存在本机数据库中，并在主进程调用；不会暴露给前端页面。</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><RefreshCw className="h-5 w-5" />软件更新</CardTitle>
            <CardDescription>检查并安装新版本</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">当前版本：{appVersion || '...'}</p>

            {status.phase === 'available' && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm font-medium">发现新版本 v{status.version}</p>
              </div>
            )}

            {status.phase === 'downloading' && (
              <div className="space-y-2">
                <p className="text-sm">正在下载... {status.percent}%</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${status.percent || 0}%` }} />
                </div>
              </div>
            )}

            {status.phase === 'downloaded' && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">下载完成，重启即可更新</p>
              </div>
            )}

            {status.phase === 'not-available' && (
              <p className="text-sm text-muted-foreground">已是最新版本</p>
            )}

            {status.phase === 'error' && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">检查失败：{status.error}</p>
              </div>
            )}

            <div className="flex gap-2">
              {status.phase === 'available' && (
                <Button onClick={downloadUpdate} className="flex-1"><Download className="h-4 w-4 mr-2" />下载更新</Button>
              )}
              {status.phase === 'downloaded' && (
                <Button onClick={installUpdate} className="flex-1"><RefreshCw className="h-4 w-4 mr-2" />立即重启安装</Button>
              )}
              <Button variant="outline" onClick={checkForUpdates} disabled={checking} className={status.phase === 'downloaded' ? '' : 'flex-1'}>
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />{checking ? '检查中...' : '检查更新'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-semibold">关于</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>PG-Tracker</strong> - 保研信息收集与决策分析系统</p>
            <p>版本：{appVersion || '...'}</p>
            <p>数据存储：本地 SQLite 数据库</p>
            <p className="pt-2">本应用完全离线运行，所有数据均存储在本地设备上，保护你的隐私。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
