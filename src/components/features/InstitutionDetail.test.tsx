import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import InstitutionDetail from './InstitutionDetail'
import { useStore, type Institution } from '../../stores/appStore'

const mockApi = {
  advisor: {
    getConflictWarnings: vi.fn(),
  },
}

// @ts-expect-error test only mocks the APIs touched by this component flow
window.api = mockApi

const advisorBase = {
  institutionId: 'inst-1',
  title: '教授',
  researchArea: '人工智能',
  homepage: null,
  contactStatus: 'PENDING' as const,
  lastContactDate: null,
  reputationScore: null,
  notes: '便于复制的备注',
  assets: [],
  interviews: [],
  contactRecords: [],
}

const institutionFixture: Institution = {
  id: 'inst-1',
  name: '测试大学',
  department: '计算机学院',
  tier: 'REACH',
  degreeType: 'MASTER',
  applicationStatus: 'WATCHING',
  campDeadline: null,
  pushDeadline: null,
  expectedQuota: null,
  policyTags: '[]',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  tasks: [],
  advisors: [
    {
      id: 'advisor-1',
      email: 'zhang@example.com',
      name: '张教授',
      ...advisorBase,
    },
    {
      id: 'advisor-2',
      email: 'li@example.com',
      name: '李教授',
      ...advisorBase,
    },
  ],
}

describe('InstitutionDetail advisor ordering mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.advisor.getConflictWarnings.mockResolvedValue([])

    useStore.setState({
      currentView: 'kanban',
      selectedInstitutionId: 'inst-1',
      institutions: [institutionFixture],
      orphanTasks: [],
      isLoading: false,
      error: null,
      conflictWarnings: [],
      emailTemplates: [],
    })
  })

  it('separates daily viewing from reorder mode', async () => {
    render(<InstitutionDetail institutionId="inst-1" onBack={() => undefined} />)

    await waitFor(() => {
      expect(mockApi.advisor.getConflictWarnings).toHaveBeenCalledWith('inst-1')
    })

    fireEvent.click(screen.getByRole('button', { name: /导师预览/i }))

    expect(await screen.findByRole('button', { name: '调整顺序' })).toBeInTheDocument()
    expect(screen.queryByLabelText('拖动排序')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '调整顺序' }))

    expect(screen.getByRole('button', { name: '完成排序' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('拖动排序')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '完成排序' }))

    expect(screen.getByRole('button', { name: '调整顺序' })).toBeInTheDocument()
    expect(screen.queryByLabelText('拖动排序')).not.toBeInTheDocument()
  })

  it('shows saved interview records on advisor cards', async () => {
    const institutionWithInterview: Institution = {
      ...institutionFixture,
      advisors: [
        {
          ...advisorBase,
          id: 'advisor-1',
          email: 'zhang@example.com',
          name: '张教授',
          interviews: [
            {
              id: 'interview-1',
              advisorId: 'advisor-1',
              date: '2026-06-01T00:00:00.000Z',
              format: 'ONLINE',
              markdownNotes: '问了项目动机\n以及论文细节'
            }
          ]
        }
      ]
    }
    useStore.setState({ institutions: [institutionWithInterview] })

    render(<InstitutionDetail institutionId="inst-1" onBack={() => undefined} />)

    fireEvent.click(screen.getByRole('button', { name: /导师预览/i }))

    expect(await screen.findByText('面经记录')).toBeInTheDocument()
    expect(screen.getByText(/2026\/06\/01/)).toBeInTheDocument()
    expect(screen.getByText(/线上/)).toBeInTheDocument()
    expect(screen.getByText(/问了项目动机/)).toBeInTheDocument()
  })

  it('deletes an interview record from the advisor card', async () => {
    const deleteInterview = vi.fn().mockResolvedValue(undefined)
    const institutionWithInterview: Institution = {
      ...institutionFixture,
      advisors: [
        {
          ...advisorBase,
          id: 'advisor-1',
          email: 'zhang@example.com',
          name: '张教授',
          interviews: [
            {
              id: 'interview-1',
              advisorId: 'advisor-1',
              date: '2026-06-01T00:00:00.000Z',
              format: 'ONLINE',
              markdownNotes: '重复记录'
            }
          ]
        }
      ]
    }
    useStore.setState({ institutions: [institutionWithInterview], deleteInterview })

    render(<InstitutionDetail institutionId="inst-1" onBack={() => undefined} />)

    fireEvent.click(screen.getByRole('button', { name: /导师预览/i }))
    fireEvent.click(await screen.findByRole('button', { name: '删除 2026/06/01 面经' }))

    await waitFor(() => {
      expect(deleteInterview).toHaveBeenCalledWith('interview-1')
    })
  })
})
