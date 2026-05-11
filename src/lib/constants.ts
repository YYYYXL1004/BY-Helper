/**
 * @Project: PG-Tracker
 * @File: constants.ts
 * @Description: 应用共享常量定义，包括申请层次、学位类型、导师状态等配置
 * @Author: 杨敬诚
 * @Date: 2026-04-15
 * Copyright (c) 2026. All rights reserved.
 */

// ==================== 申请层次 (Tier) ====================
export type Tier = 'REACH' | 'MATCH' | 'SAFETY'

export const tierLabels: Record<Tier, string> = {
  REACH: '冲',
  MATCH: '稳',
  SAFETY: '保'
}

export const tierDescriptions: Record<Tier, string> = {
  REACH: '冲 — 超出自身水平',
  MATCH: '稳 — 匹配自身水平',
  SAFETY: '保 — 保底选择'
}

export const tierColors: Record<Tier, string> = {
  REACH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  MATCH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SAFETY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
}

export const tierBorderColors: Record<Tier, string> = {
  REACH: 'border-red-300 dark:border-red-700',
  MATCH: 'border-amber-300 dark:border-amber-700',
  SAFETY: 'border-green-300 dark:border-green-700'
}

// ==================== 院校申请状态 (Application Status) ====================
export type ApplicationStatus =
  | 'WATCHING'
  | 'TO_APPLY'
  | 'APPLIED'
  | 'SCREEN_PASSED'
  | 'SHORTLISTED'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'WAITLISTED'
  | 'REJECTED'
  | 'WITHDRAWN'

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  WATCHING: '待关注',
  TO_APPLY: '待报名',
  APPLIED: '已报名',
  SCREEN_PASSED: '初审通过',
  SHORTLISTED: '入营/入围',
  INTERVIEWING: '面试中',
  OFFERED: '优营/拟录取',
  WAITLISTED: '候补',
  REJECTED: '被拒',
  WITHDRAWN: '已放弃'
}

export const applicationStatusBadge: Record<ApplicationStatus, string> = {
  WATCHING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  TO_APPLY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  APPLIED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  SCREEN_PASSED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  SHORTLISTED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  INTERVIEWING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  OFFERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  WAITLISTED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  WITHDRAWN: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
}

export const applicationStatusOptions: Array<{ value: ApplicationStatus; label: string }> =
  Object.entries(applicationStatusLabels).map(([value, label]) => ({ value: value as ApplicationStatus, label }))

// ==================== 学位类型 (Degree Type) ====================
export type DegreeType = 'MASTER' | 'PROFESSIONAL' | 'PHD'

export const degreeTypeLabels: Record<DegreeType, string> = {
  MASTER: '学硕',
  PROFESSIONAL: '专硕',
  PHD: '直博'
}

// ==================== 导师联系状态 (Contact Status) ====================
export type ContactStatus = 'PENDING' | 'SENT' | 'REPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'

export interface StatusConfig {
  label: string
  color: string
  badge: string
  dot: string
  icon?: string
}

export const contactStatusConfig: Record<ContactStatus, StatusConfig> = {
  PENDING: {
    label: '待联系',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    dot: 'bg-gray-500 dark:bg-gray-400'
  },
  SENT: {
    label: '已发送',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    dot: 'bg-blue-500 dark:bg-blue-400'
  },
  REPLIED: {
    label: '已回复',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500 dark:bg-green-400'
  },
  INTERVIEW: {
    label: '面试中',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    dot: 'bg-purple-500 dark:bg-purple-400'
  },
  REJECTED: {
    label: '已拒绝',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500 dark:bg-red-400'
  },
  ACCEPTED: {
    label: '已录取',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    dot: 'bg-emerald-500 dark:bg-emerald-400'
  }
}

export const statusOptions: { value: ContactStatus; label: string }[] = [
  { value: 'PENDING', label: '待联系' },
  { value: 'SENT', label: '已发送' },
  { value: 'REPLIED', label: '已回复' },
  { value: 'INTERVIEW', label: '面试中' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'ACCEPTED', label: '已录取' }
]

// 别名导出，兼容 InstitutionDetail 中的引用
export const advisorStatusConfig = contactStatusConfig

// ==================== 导师联系记录类型 (Contact Record Type) ====================
export type ContactRecordType = 'EMAIL_SENT' | 'EMAIL_REPLIED' | 'FOLLOW_UP' | 'WECHAT_ADDED' | 'INTERVIEW_INVITE' | 'PHONE_CALL' | 'OTHER'

export const contactRecordTypeLabels: Record<ContactRecordType, string> = {
  EMAIL_SENT: '发送邮件',
  EMAIL_REPLIED: '收到回复',
  FOLLOW_UP: '跟进联系',
  WECHAT_ADDED: '添加微信',
  INTERVIEW_INVITE: '面试邀请',
  PHONE_CALL: '电话沟通',
  OTHER: '其他'
}

export const contactRecordTypeOptions: Array<{ value: ContactRecordType; label: string }> =
  Object.entries(contactRecordTypeLabels).map(([value, label]) => ({ value: value as ContactRecordType, label }))

// ==================== 面试形式 (Interview Format) ====================
export type InterviewFormat = 'ONLINE' | 'OFFLINE'

export const interviewFormatLabels: Record<InterviewFormat, string> = {
  ONLINE: '线上',
  OFFLINE: '线下'
}

// ==================== 资产类型 (Asset Type) ====================
export type AssetType = 'RESUME' | 'TRANSCRIPT' | 'RECOMMENDATION' | 'OTHER'

export const assetTypeLabels: Record<AssetType, string> = {
  RESUME: '简历',
  TRANSCRIPT: '成绩单',
  RECOMMENDATION: '推荐信',
  OTHER: '其他'
}
