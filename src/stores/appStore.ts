/**
 * @Project: PG-Tracker
 * @File: appStore.ts
 * @Description: 应用全局状态管理，通过 Zustand 管理院校、导师、任务、AI 套磁等数据及 UI 状态
 * @Author: 杨敬诚
 * @Date: 2026-04-08
 * Copyright (c) 2026. All rights reserved.
 */
import { create } from 'zustand'
import type { ApplicationStatus, ContactRecordType } from '../lib/constants'

export interface Institution {
  id: string
  name: string
  department: string
  tier: 'REACH' | 'MATCH' | 'SAFETY'
  degreeType: 'MASTER' | 'PROFESSIONAL' | 'PHD'
  applicationStatus?: ApplicationStatus
  campDeadline: string | null
  pushDeadline: string | null
  expectedQuota: number | null
  policyTags: string
  sortOrder?: number
  createdAt: string
  updatedAt: string
  advisors?: Advisor[]
  tasks?: Task[]
}

export interface Advisor {
  id: string
  institutionId: string
  name: string
  title: string | null
  researchArea: string
  email: string
  homepage: string | null
  contactStatus: 'PENDING' | 'SENT' | 'REPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'
  lastContactDate: string | null
  reputationScore: number | null
  notes: string | null
  sortOrder?: number
  assets?: Asset[]
  interviews?: Interview[]
  contactRecords?: ContactRecord[]
  sources?: AdvisorSource[]
  insight?: AdvisorInsight | null
  emailDrafts?: EmailDraft[]
}

export interface Task {
  id: string
  institutionId: string
  title: string
  dueDate: string
  isCompleted: boolean
}

export interface Asset {
  id: string
  advisorId: string | null
  type: 'RESUME' | 'TRANSCRIPT' | 'RECOMMENDATION' | 'OTHER'
  localPath: string
}

export interface Interview {
  id: string
  advisorId: string
  date: string
  format: 'ONLINE' | 'OFFLINE'
  markdownNotes: string
}

export interface ContactRecord {
  id: string
  advisorId: string
  date: string
  type: ContactRecordType
  content: string
  createdAt?: string
}

export interface AdvisorSource {
  id: string
  advisorId: string
  url: string
  sourceType: 'WEB' | 'PDF' | 'ARXIV' | 'DBLP' | 'SEMANTIC_SCHOLAR' | string
  title: string | null
  contentText: string
  status: 'READY' | 'ERROR' | string
  error: string | null
  fetchedAt: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AdvisorInsight {
  id: string
  advisorId: string
  researchSummary: string
  recentKeywords: string
  representativeWorks: string
  fitAngles: string
  emailHooks: string
  cautions: string
  rawJson: string
  createdAt?: string
  updatedAt?: string
}

export interface EmailDraft {
  id: string
  advisorId: string
  templateId: string | null
  subject: string
  content: string
  rationale: string | null
  checklist: string | null
  status: 'DRAFT' | 'SENT' | string
  createdAt?: string
  updatedAt?: string
}

export interface EmailDraftInput {
  advisorId: string
  sourceEmail: string
}

export interface AiConfig {
  id?: string
  baseUrl: string
  model: string
  apiKeyPreview?: string | null
  systemPrompt?: string | null
  temperature?: number
  maxTokens?: number
}

export interface AiConfigInput {
  baseUrl: string
  model: string
  apiKey?: string
  systemPrompt?: string | null
  temperature?: number
  maxTokens?: number
}

export interface PersonalProfile {
  id?: string
  name?: string | null
  university?: string | null
  major?: string | null
  gpa?: string | null
  rank?: string | null
  researchInterest?: string | null
  projects?: string | null
  achievements?: string | null
  skills?: string | null
  contact?: string | null
}

export interface ContactRecordInput {
  advisorId: string
  date: string | Date
  type: ContactRecordType
  content: string
}

export interface EmailVariable {
  id: string
  name: string
  templateId: string
  createdAt?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  createdAt?: string
  updatedAt?: string
  variables?: EmailVariable[]
}

export interface InstitutionInput {
  name: string
  department: string
  tier: Institution['tier']
  degreeType: Institution['degreeType']
  applicationStatus?: ApplicationStatus
  campDeadline: string | Date | null
  pushDeadline: string | Date | null
  expectedQuota: number | null
  policyTags: string[]
}

export interface AdvisorInput {
  institutionId: string
  name: string
  title: string | null
  researchArea: string
  email: string
  homepage: string | null
  contactStatus: Advisor['contactStatus']
  lastContactDate?: string | Date | null
  reputationScore: number | null
  notes: string | null
}

export interface TaskInput {
  institutionId?: string
  title: string
  dueDate: string | Date
  isCompleted: boolean
}

export type TaskUpdate = Partial<Omit<TaskInput, 'dueDate'>> & {
  dueDate?: string | Date | null
}

export interface InterviewInput {
  advisorId: string
  date: string | Date
  format: Interview['format']
  markdownNotes: string
}

type View = 'dashboard' | 'kanban' | 'advisors' | 'aiOutreach' | 'timeline' | 'settings'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface AppState {
  currentView: View
  selectedInstitutionId: string | null
  institutions: Institution[]
  orphanTasks: Task[]
  isLoading: boolean
  error: string | null
  conflictWarnings: string[]
  emailTemplates: EmailTemplate[]
  aiConfig: AiConfig | null
  personalProfile: PersonalProfile | null
  setView: (view: View) => void
  setSelectedInstitutionId: (id: string | null) => void
  loadInstitutions: () => Promise<void>
  loadOrphanTasks: () => Promise<void>
  addInstitution: (data: InstitutionInput) => Promise<Institution>
  updateInstitution: (id: string, data: Partial<InstitutionInput>) => Promise<Institution>
  deleteInstitution: (id: string) => Promise<void>
  reorderInstitutions: (orderedIds: string[]) => Promise<void>
  addAdvisor: (data: AdvisorInput) => Promise<Advisor>
  updateAdvisor: (id: string, data: Partial<AdvisorInput>) => Promise<void>
  deleteAdvisor: (id: string) => Promise<void>
  reorderAdvisors: (orderedIds: string[]) => Promise<void>
  addTask: (data: TaskInput) => Promise<Task>
  updateTask: (id: string, data: TaskUpdate) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addAsset: (data: Omit<Asset, 'id'>) => Promise<Asset>
  deleteAsset: (id: string) => Promise<void>
  addInterview: (data: InterviewInput) => Promise<Interview>
  updateInterview: (id: string, data: Partial<InterviewInput>) => Promise<void>
  deleteInterview: (id: string) => Promise<void>
  addContactRecord: (data: ContactRecordInput) => Promise<ContactRecord>
  deleteContactRecord: (id: string) => Promise<void>
  checkConflicts: (institutionId: string) => Promise<void>
  clearError: () => void
  loadEmailTemplates: () => Promise<void>
  createEmailTemplate: (data: { name: string; subject: string; content: string }) => Promise<EmailTemplate>
  updateEmailTemplate: (id: string, data: { name: string; subject: string; content: string }) => Promise<EmailTemplate>
  deleteEmailTemplate: (id: string) => Promise<void>
  createEmailVariable: (data: { name: string; templateId: string }) => Promise<EmailVariable>
  deleteEmailVariable: (id: string) => Promise<void>
  loadAiConfig: () => Promise<void>
  saveAiConfig: (data: AiConfigInput) => Promise<AiConfig>
  testAiConfig: () => Promise<void>
  loadPersonalProfile: () => Promise<void>
  savePersonalProfile: (data: PersonalProfile) => Promise<PersonalProfile>
  addAdvisorSource: (advisorId: string, url: string) => Promise<AdvisorSource>
  deleteAdvisorSource: (id: string) => Promise<void>
  generateAdvisorInsight: (advisorId: string) => Promise<AdvisorInsight>
  generateEmailDraft: (data: EmailDraftInput) => Promise<EmailDraft>
  markEmailDraftSent: (id: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  currentView: 'kanban',
  selectedInstitutionId: null,
  institutions: [],
  orphanTasks: [],
  isLoading: false,
  error: null,
  conflictWarnings: [],
  emailTemplates: [],
  aiConfig: null,
  personalProfile: null,

  setView: (view) => set({ currentView: view }),
  setSelectedInstitutionId: (id) => set({ selectedInstitutionId: id }),

  loadInstitutions: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await window.api.institution.getAll()
      set({ institutions: data, isLoading: false })
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false })
    }
  },

  loadOrphanTasks: async () => {
    try {
      const tasks = await window.api.task.getOrphan()
      set({ orphanTasks: tasks })
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
    }
  },

  addInstitution: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newInstitution = await window.api.institution.create(data)
      const institutions = await window.api.institution.getAll()
      set({ institutions, isLoading: false })
      return institutions.find((i) => i.id === newInstitution.id) || newInstitution
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false })
      throw error
    }
  },

  updateInstitution: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await window.api.institution.update(id, data)
      const institutions = await window.api.institution.getAll()
      set({ institutions, isLoading: false })
      return institutions.find((i) => i.id === id) || updated
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false })
      throw error
    }
  },

  deleteInstitution: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await window.api.institution.delete(id)
      set((state) => ({
        institutions: state.institutions.filter((i) => i.id !== id),
        isLoading: false
      }))
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false })
      throw error
    }
  },

  reorderInstitutions: async (orderedIds) => {
    try {
      const result = await window.api.institution.reorder(orderedIds)
      if (!result.success) {
        throw new Error(result.error || '院校排序失败')
      }
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  addAdvisor: async (data) => {
    try {
      const newAdvisor = await window.api.advisor.create(data)
      await get().loadInstitutions()
      return newAdvisor
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  updateAdvisor: async (id, data) => {
    try {
      await window.api.advisor.update(id, data)
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteAdvisor: async (id) => {
    try {
      await window.api.advisor.delete(id)
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  reorderAdvisors: async (orderedIds) => {
    try {
      const result = await window.api.advisor.reorder(orderedIds)
      if (!result.success) {
        throw new Error(result.error || '导师排序失败')
      }
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  addTask: async (data) => {
    try {
      const newTask = await window.api.task.create(data)
      await get().loadInstitutions()
      if (!data.institutionId) {
        await get().loadOrphanTasks()
      }
      return newTask
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  updateTask: async (id, data) => {
    try {
      const result = await window.api.task.update(id, data)
      // handler 现在返回 { success, data, error } 结构
      if (!result.success) {
        throw new Error(result.error || '更新任务失败')
      }
      await get().loadInstitutions()
      await get().loadOrphanTasks()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteTask: async (id) => {
    try {
      await window.api.task.delete(id)
      await get().loadInstitutions()
      await get().loadOrphanTasks()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  addAsset: async (data) => {
    try {
      const asset = await window.api.asset.create(data)
      await get().loadInstitutions()
      return asset
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteAsset: async (id) => {
    try {
      await window.api.asset.delete(id)
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  addInterview: async (data) => {
    try {
      const interview = await window.api.interview.create(data)
      await get().loadInstitutions()
      return interview
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  updateInterview: async (id, data) => {
    try {
      await window.api.interview.update(id, data)
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteInterview: async (id) => {
    try {
      await window.api.interview.delete(id)
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  addContactRecord: async (data) => {
    try {
      const record = await window.api.contactRecord.create(data)
      await get().loadInstitutions()
      return record
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteContactRecord: async (id) => {
    try {
      await window.api.contactRecord.delete(id)
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  checkConflicts: async (institutionId) => {
    try {
      const warnings = await window.api.advisor.getConflictWarnings(institutionId)
      set({ conflictWarnings: warnings })
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
    }
  },

  clearError: () => set({ error: null }),

  loadEmailTemplates: async () => {
    try {
      const result = await window.api.emailTemplate.getAll()
      if (!result.success) {
        set({ error: result.error })
        return
      }
      // data is the array of templates with their variables
      set({ emailTemplates: result.data })
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
    }
  },

  createEmailTemplate: async (data) => {
    try {
      const result = await window.api.emailTemplate.create(data)
      if (!result.success) {
        set({ error: result.error })
        throw new Error(result.error)
      }
      if (!result.data) {
        throw new Error('Email template response missing data')
      }
      await get().loadEmailTemplates()
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  updateEmailTemplate: async (id, data) => {
    try {
      const result = await window.api.emailTemplate.update(id, data)
      if (!result.success) {
        set({ error: result.error })
        throw new Error(result.error)
      }
      if (!result.data) {
        throw new Error('Email template response missing data')
      }
      await get().loadEmailTemplates()
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteEmailTemplate: async (id) => {
    try {
      const result = await window.api.emailTemplate.delete(id)
      if (!result.success) {
        set({ error: result.error })
        throw new Error(result.error)
      }
      await get().loadEmailTemplates()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  createEmailVariable: async (data) => {
    try {
      const result = await window.api.emailVariable.create(data)
      if (!result.success) {
        set({ error: result.error })
        throw new Error(result.error)
      }
      if (!result.data) {
        throw new Error('Email variable response missing data')
      }
      await get().loadEmailTemplates()
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteEmailVariable: async (id) => {
    try {
      const result = await window.api.emailVariable.delete(id)
      if (!result.success) {
        set({ error: result.error })
        throw new Error(result.error)
      }
      await get().loadEmailTemplates()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  loadAiConfig: async () => {
    try {
      const result = await window.api.aiConfig.get()
      if (!result.success) {
        set({ error: result.error })
        return
      }
      set({ aiConfig: result.data || null })
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
    }
  },

  saveAiConfig: async (data) => {
    try {
      const result = await window.api.aiConfig.save(data)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'AI 配置保存失败')
      }
      set({ aiConfig: result.data })
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  testAiConfig: async () => {
    try {
      const result = await window.api.aiConfig.test()
      if (!result.success) {
        throw new Error(result.error || 'AI 连接测试失败')
      }
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  loadPersonalProfile: async () => {
    try {
      const result = await window.api.personalProfile.get()
      if (!result.success) {
        set({ error: result.error })
        return
      }
      set({ personalProfile: result.data || null })
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
    }
  },

  savePersonalProfile: async (data) => {
    try {
      const result = await window.api.personalProfile.save(data)
      if (!result.success || !result.data) {
        throw new Error(result.error || '个人背景保存失败')
      }
      set({ personalProfile: result.data })
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  addAdvisorSource: async (advisorId, url) => {
    try {
      const result = await window.api.advisorSource.addUrl(advisorId, url)
      if (!result.success || !result.data) {
        throw new Error(result.error || '导师资料读取失败')
      }
      await get().loadInstitutions()
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  deleteAdvisorSource: async (id) => {
    try {
      const result = await window.api.advisorSource.delete(id)
      if (!result.success) {
        throw new Error(result.error || '导师资料删除失败')
      }
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  generateAdvisorInsight: async (advisorId) => {
    try {
      const result = await window.api.advisorInsight.generate(advisorId)
      if (!result.success || !result.data) {
        throw new Error(result.error || '导师画像生成失败')
      }
      await get().loadInstitutions()
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  generateEmailDraft: async (data) => {
    try {
      const result = await window.api.emailDraft.generate(data)
      if (!result.success || !result.data) {
        throw new Error(result.error || '套磁草稿生成失败')
      }
      await get().loadInstitutions()
      return result.data
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  },

  markEmailDraftSent: async (id) => {
    try {
      const result = await window.api.emailDraft.markSent(id)
      if (!result.success) {
        throw new Error(result.error || '标记已发送失败')
      }
      await get().loadInstitutions()
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) })
      throw error
    }
  }
}))
