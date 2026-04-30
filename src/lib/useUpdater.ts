/**
 * @Project: PG-Tracker
 * @File: useUpdater.ts
 * @Description: 自动更新状态 Hook，封装 IPC 事件监听和更新操作
 * @Author: 杨敬诚
 * @Date: 2026-04-29
 */
import { useState, useEffect, useCallback } from 'react'

export interface UpdateStatus {
  phase: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  percent?: number
  error?: string
}

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>({ phase: 'idle' })
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const unsubscribe = window.api.updater.onStatus((newStatus: UpdateStatus) => {
      setStatus(newStatus)
      if (newStatus.phase !== 'downloading') {
        setChecking(false)
      }
    })
    return unsubscribe
  }, [])

  const checkForUpdates = useCallback(async () => {
    setChecking(true)
    setStatus({ phase: 'checking' })
    try {
      const result = await window.api.updater.check()
      if (!result.success) {
        setStatus({ phase: 'error', error: result.error || '检查更新失败' })
        setChecking(false)
      }
    } catch (err: unknown) {
      setStatus({ phase: 'error', error: err instanceof Error ? err.message : '未知错误' })
      setChecking(false)
    }
  }, [])

  const downloadUpdate = useCallback(async () => {
    try {
      const result = await window.api.updater.download()
      if (!result.success) {
        setStatus({ phase: 'error', error: result.error || '下载更新失败' })
      }
    } catch (err: unknown) {
      setStatus({ phase: 'error', error: err instanceof Error ? err.message : '未知错误' })
    }
  }, [])

  const installUpdate = useCallback(() => {
    window.api.updater.install()
  }, [])

  return { status, checking, checkForUpdates, downloadUpdate, installUpdate }
}
